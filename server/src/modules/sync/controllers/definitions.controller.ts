import { Request, Response, NextFunction } from 'express';
import { channelsService } from '../services/channels.service';

function getTenantId(req: Request): string {
  return req.user?.tenantId || 'master';
}

export async function getCapabilityConfigSchema(_req: Request, res: Response) {
  res.json({ success: true, data: channelsService.getCapabilityConfigSchema() });
}

export async function listChannelTypes(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await channelsService.listChannelTypes(getTenantId(req));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getChannelTypeById(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await channelsService.getChannelTypeById(getTenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createChannelType(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await channelsService.createChannelType(getTenantId(req), req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updateChannelType(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await channelsService.updateChannelType(
      getTenantId(req),
      req.params.id,
      req.body
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function deleteChannelType(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await channelsService.deleteChannelType(getTenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function listChannelVersions(req: Request, res: Response, next: NextFunction) {
  try {
    const typeId = typeof req.query.typeId === 'string' ? req.query.typeId : undefined;
    const data = await channelsService.listChannelVersions(getTenantId(req), typeId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createChannelVersion(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await channelsService.createChannelVersion(getTenantId(req), req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updateChannelVersion(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await channelsService.updateChannelVersion(
      getTenantId(req),
      req.params.id,
      req.body
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function deleteChannelVersion(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await channelsService.deleteChannelVersion(getTenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function listChannels(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await channelsService.listChannels(getTenantId(req));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getChannelById(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await channelsService.getChannelById(getTenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createChannel(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await channelsService.createChannel(getTenantId(req), req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updateChannel(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await channelsService.updateChannel(
      getTenantId(req),
      req.params.id,
      req.body
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function deleteChannel(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await channelsService.deleteChannel(getTenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function listMetadataDefinitions(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await channelsService.listMetadataDefinitions(getTenantId(req), {
      channelId: typeof req.query.channelId === 'string' ? req.query.channelId : undefined,
      entityType: typeof req.query.entityType === 'string' ? req.query.entityType : undefined,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createMetadataDefinition(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await channelsService.createMetadataDefinition(getTenantId(req), req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updateMetadataDefinition(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await channelsService.updateMetadataDefinition(
      getTenantId(req),
      req.params.id,
      req.body
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function deleteMetadataDefinition(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await channelsService.deleteMetadataDefinition(getTenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
