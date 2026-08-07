-- AppuraPe internal commerce migration diagnostics.
-- Read-only checks before applying AddInternalCommerceMvp to a shared/remote database.

-- Duplicate financial movements by order and movement type.
-- Must return 0 rows before creating the unique filtered index.
SELECT "OrderId", "Type", COUNT(*) AS "Duplicates"
FROM financial_movements
WHERE "OrderId" IS NOT NULL
GROUP BY "OrderId", "Type"
HAVING COUNT(*) > 1;

-- Duplicate financial movements by Community request and movement type.
-- Must return 0 rows before creating the unique filtered index.
SELECT "CommunityRequestId", "Type", COUNT(*) AS "Duplicates"
FROM financial_movements
WHERE "CommunityRequestId" IS NOT NULL
GROUP BY "CommunityRequestId", "Type"
HAVING COUNT(*) > 1;

-- Duplicate active collaborator verification requests.
-- Status values: 1 = PendingVerification, 2 = Verified.
-- Must return 0 rows before creating the unique filtered index.
SELECT "UserId", COUNT(*) AS "ActiveVerifications"
FROM collaborator_verifications
WHERE "Status" IN (1, 2)
GROUP BY "UserId"
HAVING COUNT(*) > 1;
