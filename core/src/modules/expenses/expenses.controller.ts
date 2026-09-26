import { Request, Response } from 'express';
import { prisma } from '../../prisma';

// 1. GET /api/expenses - List expenses with filters and search
export async function getExpenses(req: Request, res: Response): Promise<void> {
  try {
    const { category, status, search, from, to } = req.query;

    const where: any = {};

    if (category) {
      where.category = category as string;
    }
    if (status) {
      where.status = status as string;
    }
    if (from || to) {
      where.issueDate = {};
      if (from) where.issueDate.gte = new Date(from as string);
      if (to) where.issueDate.lte = new Date(to as string);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { expenseNumber: { contains: q } },
        { supplierName: { contains: q } },
        { supplierTaxId: { contains: q } },
        { notes: { contains: q } },
      ];
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { issueDate: 'desc' },
    });

    res.json({
      success: true,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener gastos de la empresa', error });
  }
}

// 2. POST /api/expenses - Create new expense
export async function createExpense(req: Request, res: Response): Promise<void> {
  try {
    const {
      supplierName,
      supplierTaxId,
      category = 'OPERATIONAL',
      issueDate,
      dueDate,
      subtotal = 0,
      taxRate = 21,
      paymentMethod = 'BANK_TRANSFER',
      status = 'PAID',
      notes,
      receiptUrl,
    } = req.body;

    if (!supplierName) {
      res.status(400).json({ success: false, message: 'El nombre del proveedor es obligatorio' });
      return;
    }

    const sub = Number(subtotal) || 0;
    const rate = Number(taxRate) || 0;
    const taxAmount = Number(((sub * rate) / 100).toFixed(2));
    const total = Number((sub + taxAmount).toFixed(2));

    // Generate unique sequential expense number
    const count = await prisma.expense.count();
    const year = new Date().getFullYear();
    const seq = String(count + 1).padStart(4, '0');
    const expenseNumber = `EXP-${year}-${seq}`;

    const expense = await prisma.expense.create({
      data: {
        expenseNumber,
        supplierName,
        supplierTaxId: supplierTaxId || null,
        category: category.toUpperCase(),
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal: sub,
        taxRate: rate,
        taxAmount,
        total,
        status: status.toUpperCase(),
        paymentMethod: paymentMethod.toUpperCase(),
        notes: notes || null,
        receiptUrl: receiptUrl || null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'CREATE_EXPENSE',
        entity: 'Expense',
        entityId: expense.id,
        details: JSON.stringify({ expenseNumber: expense.expenseNumber, total: expense.total, supplier: expense.supplierName }),
      },
    });

    res.status(201).json({
      success: true,
      data: expense,
      message: 'Gasto registrado correctamente',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al registrar gasto', error });
  }
}

// 3. PATCH /api/expenses/:id - Update expense
export async function updateExpense(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const {
      supplierName,
      supplierTaxId,
      category,
      issueDate,
      dueDate,
      subtotal,
      taxRate,
      status,
      paymentMethod,
      notes,
      receiptUrl,
    } = req.body;

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Gasto no encontrado' });
      return;
    }

    const data: any = {};
    if (supplierName !== undefined) data.supplierName = supplierName;
    if (supplierTaxId !== undefined) data.supplierTaxId = supplierTaxId;
    if (category !== undefined) data.category = category.toUpperCase();
    if (issueDate !== undefined) data.issueDate = new Date(issueDate);
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (status !== undefined) data.status = status.toUpperCase();
    if (paymentMethod !== undefined) data.paymentMethod = paymentMethod.toUpperCase();
    if (notes !== undefined) data.notes = notes;
    if (receiptUrl !== undefined) data.receiptUrl = receiptUrl;

    if (subtotal !== undefined || taxRate !== undefined) {
      const sub = subtotal !== undefined ? Number(subtotal) : existing.subtotal;
      const rate = taxRate !== undefined ? Number(taxRate) : existing.taxRate;
      data.subtotal = sub;
      data.taxRate = rate;
      data.taxAmount = Number(((sub * rate) / 100).toFixed(2));
      data.total = Number((sub + data.taxAmount).toFixed(2));
    }

    const updated = await prisma.expense.update({
      where: { id },
      data,
    });

    res.json({
      success: true,
      data: updated,
      message: 'Gasto actualizado correctamente',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar gasto', error });
  }
}

// 4. DELETE /api/expenses/:id - Delete expense
export async function deleteExpense(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Gasto no encontrado' });
      return;
    }

    await prisma.expense.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Gasto eliminado correctamente',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar gasto', error });
  }
}

// 5. GET /api/expenses/pnl/summary - P&L Profit & Loss Calculation and Tax Balance
export async function getPnLSummary(req: Request, res: Response): Promise<void> {
  try {
    const [invoices, expenses] = await Promise.all([
      prisma.invoice.findMany({ select: { subtotal: true, taxAmount: true, total: true, status: true } }),
      prisma.expense.findMany({ select: { subtotal: true, taxAmount: true, total: true, status: true, category: true } }),
    ]);

    const totalInvoiced = invoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
    const paidRevenue = invoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((acc, inv) => acc + (inv.total || 0), 0);
    const invoicedSubtotal = invoices.reduce((acc, inv) => acc + (inv.subtotal || 0), 0);
    const outputVat = invoices.reduce((acc, inv) => acc + (inv.taxAmount || 0), 0); // IVA Repercutido

    const totalExpenses = expenses.reduce((acc, exp) => acc + (exp.total || 0), 0);
    const paidExpenses = expenses
      .filter((exp) => exp.status === 'PAID')
      .reduce((acc, exp) => acc + (exp.total || 0), 0);
    const expensesSubtotal = expenses.reduce((acc, exp) => acc + (exp.subtotal || 0), 0);
    const deductibleVat = expenses.reduce((acc, exp) => acc + (exp.taxAmount || 0), 0); // IVA Soportado Deducible

    // Net operating profit (Pre-tax)
    const operatingProfit = Number((invoicedSubtotal - expensesSubtotal).toFixed(2));
    const operatingMarginPct =
      invoicedSubtotal > 0 ? Number(((operatingProfit / invoicedSubtotal) * 100).toFixed(1)) : 0;

    // VAT Balance to settle (Modelo 303)
    const vatBalanceToPay = Number((outputVat - deductibleVat).toFixed(2));

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    for (const exp of expenses) {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.total;
    }
    const categoryBreakdown = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2)),
    }));

    res.json({
      success: true,
      data: {
        totalInvoiced: Number(totalInvoiced.toFixed(2)),
        paidRevenue: Number(paidRevenue.toFixed(2)),
        invoicedSubtotal: Number(invoicedSubtotal.toFixed(2)),
        outputVat: Number(outputVat.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        paidExpenses: Number(paidExpenses.toFixed(2)),
        expensesSubtotal: Number(expensesSubtotal.toFixed(2)),
        deductibleVat: Number(deductibleVat.toFixed(2)),
        operatingProfit,
        operatingMarginPct,
        vatBalanceToPay,
        categoryBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al calcular resumen P&L', error });
  }
}
