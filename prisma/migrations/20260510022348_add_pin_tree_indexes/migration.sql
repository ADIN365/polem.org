-- CreateIndex
CREATE INDEX "Pin_boardId_side_quotedPinId_createdAt_idx" ON "Pin"("boardId", "side", "quotedPinId", "createdAt");

-- CreateIndex
CREATE INDEX "Pin_quotedPinId_idx" ON "Pin"("quotedPinId");
