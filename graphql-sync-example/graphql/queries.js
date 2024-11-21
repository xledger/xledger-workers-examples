const PROJECT_FIELDS = `
fromDate
toDate
dbId
code
description
createdAt
modifiedAt
text
ownerDbId
email
yourReference
extIdentifier
external
billable
fixedClient
allowPosting
timesheetEntry
accessControl
assignment
activity
extOrder
contract
progressDate
pctCompleted
overview
expenseLedger
fundProject
invoiceHeader
invoiceFooter
totalRevenue
yearlyRevenue
contractedRevenue
totalCost
yearlyCost
totalEstimateHours
yearlyEstimateHours
budgetCoveragePercent
mainProjectDbId
shortInfo
shortInternalInfo
xgl {
    dbId
    code
}
glObject1 {
    dbId
    code
}
glObject2 {
    dbId
    code
}
glObject3 {
    dbId
    code
}
glObject4 {
    dbId
    code
}
glObject5 {
    dbId
    code
}
`;

export const PROJECTS = `
query ($after: String) {
    projects(first: 10000, after: $after) {
        edges {
            cursor
            node {
                ${PROJECT_FIELDS}
            }
        }
        pageInfo { hasNextPage }
    }
}
`;

export const PROJECT_DELTAS = `
query($after: String, $modifiedAfter: DateTimeString) {
    project_deltas(first: 1000, after: $after, filter: {modifiedAt_gt: $modifiedAfter}) {
        edges {
            cursor
            node {
                ${PROJECT_FIELDS}
            }
        }
        pageInfo { hasNextPage }
    }
}
`;
