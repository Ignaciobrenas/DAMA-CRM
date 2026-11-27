import { prisma } from '../../../prisma';
import {
  CAPABILITY_CONFIG_SCHEMA,
  getDefaultCapabilities,
} from '../config-schema/capability-config.schema';
import { ensureTenantSyncDefaults } from '../seeds/sync-defaults.seed';
import {
  ChannelCapabilities,
  ChannelCategory,
  safeJsonParse,
  SyncHttpError,
} from '../types/sync.types';

export interface CreateChannelTypeInput {
  name: string;
  description?: string;
  type?: ChannelCategory;
  capabilities?: Partial<ChannelCapabilities>;
  connectorKey?: string | null;
}

export interface CreateChannelVersionInput {
  typeId: string;
  version: string;
  description?: string;
}

export interface CreateChannelInput {
  name: string;
  description?: string;
  status?: 'active' | 'inactive' | 'maintenance';
  typeId: string;
  versionId: string;
}

export interface CreateMetadataDefinitionInput {
  channelId: string;
  entityType: string;
  key: string;
  label: string;
  dataType?: 'string' | 'number' | 'boolean' | 'json' | 'date' | 'select';
  required?: boolean;
  defaultValue?: string | null;
  description?: string | null;
  namespace?: string | null;
  mappingPath?: string | null;
  isActive?: boolean;
}

export class ChannelsService {
  // ---------------------------------------------------------------------------
  // Channel Types & Capability Config Schema
  // ---------------------------------------------------------------------------

  public getCapabilityConfigSchema() {
    return CAPABILITY_CONFIG_SCHEMA;
  }

  public async listChannelTypes(tenantId: string) {
    await ensureTenantSyncDefaults(tenantId);

    const types = await prisma.syncChannelType.findMany({
      where: { tenantId },
      include: {
        versions: { orderBy: { version: 'desc' } },
        _count: { select: { channels: true } },
      },
      orderBy: { name: 'asc' },
    });

    return types.map((t) => ({
      ...t,
      capabilities: {
        ...getDefaultCapabilities(t.type),
        ...safeJsonParse<Partial<ChannelCapabilities>>(t.capabilities, {}),
      },
      channelCount: t._count.channels,
    }));
  }

  public async getChannelTypeById(tenantId: string, id: string) {
    const channelType = await prisma.syncChannelType.findFirst({
      where: { id, tenantId },
      include: { versions: true, channels: true },
    });
    if (!channelType) {
      throw new SyncHttpError(404, `Channel type "${id}" not found`);
    }
    return {
      ...channelType,
      capabilities: {
        ...getDefaultCapabilities(channelType.type),
        ...safeJsonParse<Partial<ChannelCapabilities>>(channelType.capabilities, {}),
      },
    };
  }

  public async createChannelType(tenantId: string, input: CreateChannelTypeInput) {
    if (!input.name?.trim()) {
      throw new SyncHttpError(400, 'Channel type name is required');
    }

    const category: ChannelCategory = input.type || 'B2C';
    const mergedCapabilities: ChannelCapabilities = {
      ...getDefaultCapabilities(category),
      ...(input.capabilities || {}),
    };

    const existing = await prisma.syncChannelType.findUnique({
      where: { tenantId_name: { tenantId, name: input.name.trim() } },
    });
    if (existing) {
      throw new SyncHttpError(409, `Channel type "${input.name.trim()}" already exists`);
    }

    const created = await prisma.syncChannelType.create({
      data: {
        tenantId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        type: category,
        capabilities: JSON.stringify(mergedCapabilities),
        connectorKey: input.connectorKey ?? null,
      },
      include: { versions: true },
    });

    return { ...created, capabilities: mergedCapabilities };
  }

  public async updateChannelType(
    tenantId: string,
    id: string,
    input: Partial<CreateChannelTypeInput>
  ) {
    const existing = await prisma.syncChannelType.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new SyncHttpError(404, `Channel type "${id}" not found`);
    }

    const currentCaps = {
      ...getDefaultCapabilities(existing.type),
      ...safeJsonParse<Partial<ChannelCapabilities>>(existing.capabilities, {}),
    };
    const nextCaps = input.capabilities
      ? { ...currentCaps, ...input.capabilities }
      : currentCaps;

    const updated = await prisma.syncChannelType.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.connectorKey !== undefined ? { connectorKey: input.connectorKey } : {}),
        capabilities: JSON.stringify(nextCaps),
      },
      include: { versions: true },
    });

    return { ...updated, capabilities: nextCaps };
  }

  public async deleteChannelType(tenantId: string, id: string) {
    const existing = await prisma.syncChannelType.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { channels: true } } },
    });
    if (!existing) {
      throw new SyncHttpError(404, `Channel type "${id}" not found`);
    }
    if (existing._count.channels > 0) {
      throw new SyncHttpError(
        400,
        `Cannot delete channel type "${existing.name}" because ${existing._count.channels} channel(s) reference it`
      );
    }
    await prisma.syncChannelType.delete({ where: { id } });
    return { deleted: true, id };
  }

  // ---------------------------------------------------------------------------
  // Channel Version Types
  // ---------------------------------------------------------------------------

  public async listChannelVersions(tenantId: string, typeId?: string) {
    await ensureTenantSyncDefaults(tenantId);
    return prisma.syncChannelVersionType.findMany({
      where: { tenantId, ...(typeId ? { typeId } : {}) },
      include: { channelType: { select: { id: true, name: true, type: true } } },
      orderBy: [{ typeId: 'asc' }, { version: 'desc' }],
    });
  }

  public async createChannelVersion(tenantId: string, input: CreateChannelVersionInput) {
    if (!input.typeId || !input.version?.trim()) {
      throw new SyncHttpError(400, 'typeId and version are required');
    }
    const parent = await prisma.syncChannelType.findFirst({
      where: { id: input.typeId, tenantId },
    });
    if (!parent) {
      throw new SyncHttpError(404, `Channel type "${input.typeId}" not found`);
    }

    const existing = await prisma.syncChannelVersionType.findUnique({
      where: { typeId_version: { typeId: input.typeId, version: input.version.trim() } },
    });
    if (existing) {
      throw new SyncHttpError(
        409,
        `Version "${input.version.trim()}" already exists for channel type "${parent.name}"`
      );
    }

    return prisma.syncChannelVersionType.create({
      data: {
        tenantId,
        typeId: input.typeId,
        version: input.version.trim(),
        description: input.description?.trim() || null,
      },
      include: { channelType: { select: { id: true, name: true, type: true } } },
    });
  }

  public async updateChannelVersion(
    tenantId: string,
    id: string,
    input: Partial<Omit<CreateChannelVersionInput, 'typeId'>>
  ) {
    const existing = await prisma.syncChannelVersionType.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new SyncHttpError(404, `Channel version "${id}" not found`);
    }

    return prisma.syncChannelVersionType.update({
      where: { id },
      data: {
        ...(input.version !== undefined ? { version: input.version.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      },
    });
  }

  public async deleteChannelVersion(tenantId: string, id: string) {
    const existing = await prisma.syncChannelVersionType.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { channels: true } } },
    });
    if (!existing) {
      throw new SyncHttpError(404, `Channel version "${id}" not found`);
    }
    if (existing._count.channels > 0) {
      throw new SyncHttpError(
        400,
        `Cannot delete channel version "${existing.version}" while ${existing._count.channels} channel(s) reference it`
      );
    }
    await prisma.syncChannelVersionType.delete({ where: { id } });
    return { deleted: true, id };
  }

  // ---------------------------------------------------------------------------
  // Channels
  // ---------------------------------------------------------------------------

  public async listChannels(tenantId: string) {
    await ensureTenantSyncDefaults(tenantId);
    const channels = await prisma.syncChannel.findMany({
      where: { tenantId },
      include: {
        channelType: true,
        versionType: true,
        connections: {
          include: {
            environment: { select: { id: true, name: true, status: true } },
          },
        },
        _count: { select: { metadataDefinitions: true } },
      },
      orderBy: { name: 'asc' },
    });

    return channels.map((ch) => ({
      ...ch,
      channelType: {
        ...ch.channelType,
        capabilities: {
          ...getDefaultCapabilities(ch.channelType.type),
          ...safeJsonParse<Partial<ChannelCapabilities>>(ch.channelType.capabilities, {}),
        },
      },
      metadataCount: ch._count.metadataDefinitions,
    }));
  }

  public async getChannelById(tenantId: string, id: string) {
    const channel = await prisma.syncChannel.findFirst({
      where: { id, tenantId },
      include: {
        channelType: true,
        versionType: true,
        connections: { include: { environment: true } },
        metadataDefinitions: true,
      },
    });
    if (!channel) {
      throw new SyncHttpError(404, `Channel "${id}" not found`);
    }
    return {
      ...channel,
      channelType: {
        ...channel.channelType,
        capabilities: {
          ...getDefaultCapabilities(channel.channelType.type),
          ...safeJsonParse<Partial<ChannelCapabilities>>(channel.channelType.capabilities, {}),
        },
      },
    };
  }

  public async createChannel(tenantId: string, input: CreateChannelInput) {
    if (!input.name?.trim() || !input.typeId || !input.versionId) {
      throw new SyncHttpError(400, 'Channel name, typeId, and versionId are required');
    }

    const version = await prisma.syncChannelVersionType.findFirst({
      where: { id: input.versionId, typeId: input.typeId, tenantId },
    });
    if (!version) {
      throw new SyncHttpError(
        400,
        'Selected channel version does not exist or does not belong to the chosen channel type'
      );
    }

    const duplicate = await prisma.syncChannel.findUnique({
      where: { tenantId_name: { tenantId, name: input.name.trim() } },
    });
    if (duplicate) {
      throw new SyncHttpError(409, `Channel "${input.name.trim()}" already exists`);
    }

    return prisma.syncChannel.create({
      data: {
        tenantId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        status: input.status || 'active',
        typeId: input.typeId,
        versionId: input.versionId,
      },
      include: { channelType: true, versionType: true },
    });
  }

  public async updateChannel(tenantId: string, id: string, input: Partial<CreateChannelInput>) {
    const existing = await prisma.syncChannel.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new SyncHttpError(404, `Channel "${id}" not found`);
    }

    const nextTypeId = input.typeId ?? existing.typeId;
    const nextVersionId = input.versionId ?? existing.versionId;
    if (input.typeId || input.versionId) {
      const version = await prisma.syncChannelVersionType.findFirst({
        where: { id: nextVersionId, typeId: nextTypeId, tenantId },
      });
      if (!version) {
        throw new SyncHttpError(
          400,
          'Selected channel version does not belong to the specified channel type'
        );
      }
    }

    return prisma.syncChannel.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        typeId: nextTypeId,
        versionId: nextVersionId,
      },
      include: { channelType: true, versionType: true },
    });
  }

  public async deleteChannel(tenantId: string, id: string) {
    const existing = await prisma.syncChannel.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new SyncHttpError(404, `Channel "${id}" not found`);
    }
    await prisma.syncChannel.delete({ where: { id } });
    return { deleted: true, id };
  }

  // ---------------------------------------------------------------------------
  // Channel Metadata Definitions
  // ---------------------------------------------------------------------------

  public async listMetadataDefinitions(
    tenantId: string,
    filters: { channelId?: string; entityType?: string } = {}
  ) {
    return prisma.syncChannelMetadataDefinition.findMany({
      where: {
        tenantId,
        ...(filters.channelId ? { channelId: filters.channelId } : {}),
        ...(filters.entityType ? { entityType: filters.entityType } : {}),
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            channelType: { select: { id: true, name: true, type: true } },
          },
        },
      },
      orderBy: [{ entityType: 'asc' }, { key: 'asc' }],
    });
  }

  public async createMetadataDefinition(
    tenantId: string,
    input: CreateMetadataDefinitionInput
  ) {
    if (!input.channelId || !input.entityType?.trim() || !input.key?.trim() || !input.label?.trim()) {
      throw new SyncHttpError(400, 'channelId, entityType, key, and label are required');
    }

    const channel = await prisma.syncChannel.findFirst({
      where: { id: input.channelId, tenantId },
    });
    if (!channel) {
      throw new SyncHttpError(404, `Channel "${input.channelId}" not found`);
    }

    const existing = await prisma.syncChannelMetadataDefinition.findUnique({
      where: {
        channelId_entityType_key: {
          channelId: input.channelId,
          entityType: input.entityType.trim(),
          key: input.key.trim(),
        },
      },
    });
    if (existing) {
      throw new SyncHttpError(
        409,
        `Metadata definition "${input.key.trim()}" already exists for entity "${input.entityType.trim()}" on this channel`
      );
    }

    return prisma.syncChannelMetadataDefinition.create({
      data: {
        tenantId,
        channelId: input.channelId,
        entityType: input.entityType.trim(),
        key: input.key.trim(),
        label: input.label.trim(),
        dataType: input.dataType || 'string',
        required: Boolean(input.required),
        defaultValue: input.defaultValue ?? null,
        description: input.description ?? null,
        namespace: input.namespace ?? null,
        mappingPath: input.mappingPath ?? null,
        isActive: input.isActive ?? true,
      },
      include: { channel: { select: { id: true, name: true } } },
    });
  }

  public async updateMetadataDefinition(
    tenantId: string,
    id: string,
    input: Partial<CreateMetadataDefinitionInput>
  ) {
    const existing = await prisma.syncChannelMetadataDefinition.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new SyncHttpError(404, `Metadata definition "${id}" not found`);
    }

    return prisma.syncChannelMetadataDefinition.update({
      where: { id },
      data: {
        ...(input.entityType !== undefined ? { entityType: input.entityType.trim() } : {}),
        ...(input.key !== undefined ? { key: input.key.trim() } : {}),
        ...(input.label !== undefined ? { label: input.label.trim() } : {}),
        ...(input.dataType !== undefined ? { dataType: input.dataType } : {}),
        ...(input.required !== undefined ? { required: input.required } : {}),
        ...(input.defaultValue !== undefined ? { defaultValue: input.defaultValue } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.namespace !== undefined ? { namespace: input.namespace } : {}),
        ...(input.mappingPath !== undefined ? { mappingPath: input.mappingPath } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
  }

  public async deleteMetadataDefinition(tenantId: string, id: string) {
    const existing = await prisma.syncChannelMetadataDefinition.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new SyncHttpError(404, `Metadata definition "${id}" not found`);
    }
    await prisma.syncChannelMetadataDefinition.delete({ where: { id } });
    return { deleted: true, id };
  }
}

export const channelsService = new ChannelsService();
