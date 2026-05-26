-- CreateIndex
CREATE INDEX "MedicinalProduct_medicationId_idx" ON "MedicinalProduct"("medicationId");

-- CreateIndex
CREATE INDEX "Order_wardUnitId_idx" ON "Order"("wardUnitId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "OrderLine_orderId_idx" ON "OrderLine"("orderId");

-- CreateIndex
CREATE INDEX "OrderLine_medicationId_idx" ON "OrderLine"("medicationId");

-- CreateIndex
CREATE INDEX "Actor_wardUnitId_idx" ON "Actor"("wardUnitId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_occurredAt_idx" ON "AuditLog"("occurredAt");
