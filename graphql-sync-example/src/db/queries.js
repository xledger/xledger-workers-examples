export const ENSURE_SCHEMA = `
create table if not exists SyncStatus(
   tableName text primary key
  ,syncType text not null
  ,syncValue text
  ,startTime real not null
  ,asOfTime real not null
);

create table if not exists ObjectValue(
   id integer primary key
  ,xledgerDbId integer unique
  ,code text
  ,description text
);

create table if not exists Project(
   id integer primary key
  ,xledgerDbId integer unique
  ,fromDate dateInt
  ,toDate dateInt
  ,code text
  ,description text
  ,createdAt dateTimeReal
  ,modifiedAt dateTimeReal
  ,"text" text
  ,ownerDbId integer
  ,email text
  ,yourReference text
  ,extIdentifier text
  ,external boolInt
  ,billable boolInt
  ,fixedClient boolInt
  ,allowPosting boolInt
  ,timesheetEntry boolInt
  ,accessControl boolInt
  ,assignment boolInt
  ,activity boolInt
  ,extOrder text
  ,contract text
  ,progressDate dateTimeReal
  ,pctCompleted real
  ,overview text
  ,expenseLedger boolInt
  ,fundProject boolInt
  ,invoiceHeader text
  ,invoiceFooter text
  ,totalRevenue real
  ,yearlyRevenue real
  ,contractedRevenue real
  ,totalCost real
  ,yearlyCost real
  ,totalEstimateHours real
  ,yearlyEstimateHours real
  ,budgetCoveragePercent real
  ,shortInfo text
  ,shortInternalInfo text
  ,mainProjectId projectInt
  ,xglId objectValueInt
  ,glObject5Id objectValueInt
  ,glObject4Id objectValueInt
  ,glObject3Id objectValueInt
  ,glObject2Id objectValueInt
  ,glObject1Id objectValueInt
);
`;

export const UPSERT_PROJECT = `
insert into Project(
    "xledgerDbId", "fromDate", "toDate",
    "code", "description", "createdAt",
    "modifiedAt", "text", "email",
    "yourReference", "extIdentifier", "external",
    "billable", "fixedClient", "allowPosting",
    "timesheetEntry", "accessControl", "assignment",
    "activity", "extOrder", "contract",
    "progressDate", "pctCompleted", "overview",
    "expenseLedger", "fundProject", "invoiceHeader",
    "invoiceFooter", "totalRevenue", "yearlyRevenue",
    "contractedRevenue", "totalCost", "yearlyCost",
    "totalEstimateHours", "yearlyEstimateHours", "budgetCoveragePercent",
    "mainProjectId", "shortInfo", "shortInternalInfo",
    "xglId", "glObject1Id", "glObject2Id",
    "glObject3Id", "glObject4Id", "glObject5Id"
 )
 values (
    $xledgerDbId, $fromDate, $toDate,
    $code, $description, $createdAt,
    $modifiedAt, $text, $email,
    $yourReference, $extIdentifier, $external,
    $billable, $fixedClient, $allowPosting,
    $timesheetEntry, $accessControl, $assignment,
    $activity, $extOrder, $contract,
    $progressDate, $pctCompleted, $overview,
    $expenseLedger, $fundProject, $invoiceHeader,
    $invoiceFooter, $totalRevenue, $yearlyRevenue,
    $contractedRevenue, $totalCost, $yearlyCost,
    $totalEstimateHours, $yearlyEstimateHours, $budgetCoveragePercent,
    $mainProjectId, $shortInfo, $shortInternalInfo,
    $xglId, $glObject1Id, $glObject2Id,
    $glObject3Id, $glObject4Id, $glObject5Id
 )
 on conflict(xledgerDbId)
 do update set
    "fromDate" = excluded."fromDate"
   ,"toDate" = excluded."toDate"
   ,"code" = excluded."code"
   ,"description" = excluded."description"
   ,"createdAt" = excluded."createdAt"
   ,"modifiedAt" = excluded."modifiedAt"
   ,"text" = excluded."text"
   ,"email" = excluded."email"
   ,"yourReference" = excluded."yourReference"
   ,"extIdentifier" = excluded."extIdentifier"
   ,"external" = excluded."external"
   ,"billable" = excluded."billable"
   ,"fixedClient" = excluded."fixedClient"
   ,"allowPosting" = excluded."allowPosting"
   ,"timesheetEntry" = excluded."timesheetEntry"
   ,"accessControl" = excluded."accessControl"
   ,"assignment" = excluded."assignment"
   ,"activity" = excluded."activity"
   ,"extOrder" = excluded."extOrder"
   ,"contract" = excluded."contract"
   ,"progressDate" = excluded."progressDate"
   ,"pctCompleted" = excluded."pctCompleted"
   ,"overview" = excluded."overview"
   ,"expenseLedger" = excluded."expenseLedger"
   ,"fundProject" = excluded."fundProject"
   ,"invoiceHeader" = excluded."invoiceHeader"
   ,"invoiceFooter" = excluded."invoiceFooter"
   ,"totalRevenue" = excluded."totalRevenue"
   ,"yearlyRevenue" = excluded."yearlyRevenue"
   ,"contractedRevenue" = excluded."contractedRevenue"
   ,"totalCost" = excluded."totalCost"
   ,"yearlyCost" = excluded."yearlyCost"
   ,"totalEstimateHours" = excluded."totalEstimateHours"
   ,"yearlyEstimateHours" = excluded."yearlyEstimateHours"
   ,"budgetCoveragePercent" = excluded."budgetCoveragePercent"
   ,"mainProjectId" = excluded."mainProjectId"
   ,"shortInfo" = excluded."shortInfo"
   ,"shortInternalInfo" = excluded."shortInternalInfo"
   ,"xglId" = excluded."xglId"
   ,"glObject1Id" = excluded."glObject1Id"
   ,"glObject2Id" = excluded."glObject2Id"
   ,"glObject3Id" = excluded."glObject3Id"
   ,"glObject4Id" = excluded."glObject4Id"
   ,"glObject5Id" = excluded."glObject5Id"
`;
