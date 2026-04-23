# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `clinical-connector`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetPatientHistory*](#getpatienthistory)
  - [*SearchSessions*](#searchsessions)
  - [*GetSpecialistDetails*](#getspecialistdetails)
- [**Mutations**](#mutations)
  - [*CreateClinicalSession*](#createclinicalsession)
  - [*AssignPatient*](#assignpatient)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `clinical-connector`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@urkio/dataconnect` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@urkio/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@urkio/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `clinical-connector` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetPatientHistory
You can execute the `GetPatientHistory` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
getPatientHistory(vars: GetPatientHistoryVariables): QueryPromise<GetPatientHistoryData, GetPatientHistoryVariables>;

interface GetPatientHistoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetPatientHistoryVariables): QueryRef<GetPatientHistoryData, GetPatientHistoryVariables>;
}
export const getPatientHistoryRef: GetPatientHistoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getPatientHistory(dc: DataConnect, vars: GetPatientHistoryVariables): QueryPromise<GetPatientHistoryData, GetPatientHistoryVariables>;

interface GetPatientHistoryRef {
  ...
  (dc: DataConnect, vars: GetPatientHistoryVariables): QueryRef<GetPatientHistoryData, GetPatientHistoryVariables>;
}
export const getPatientHistoryRef: GetPatientHistoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getPatientHistoryRef:
```typescript
const name = getPatientHistoryRef.operationName;
console.log(name);
```

### Variables
The `GetPatientHistory` query requires an argument of type `GetPatientHistoryVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetPatientHistoryVariables {
  patientId: UUIDString;
}
```
### Return Type
Recall that executing the `GetPatientHistory` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetPatientHistoryData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetPatientHistoryData {
  clinicalSessions: ({
    id: UUIDString;
    sessionDate: TimestampString;
    summary?: string | null;
    emotionalSentiment?: number | null;
    keywordsOfConcern?: string[] | null;
  } & ClinicalSession_Key)[];
}
```
### Using `GetPatientHistory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getPatientHistory, GetPatientHistoryVariables } from '@urkio/dataconnect';

// The `GetPatientHistory` query requires an argument of type `GetPatientHistoryVariables`:
const getPatientHistoryVars: GetPatientHistoryVariables = {
  patientId: ..., 
};

// Call the `getPatientHistory()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getPatientHistory(getPatientHistoryVars);
// Variables can be defined inline as well.
const { data } = await getPatientHistory({ patientId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getPatientHistory(dataConnect, getPatientHistoryVars);

console.log(data.clinicalSessions);

// Or, you can use the `Promise` API.
getPatientHistory(getPatientHistoryVars).then((response) => {
  const data = response.data;
  console.log(data.clinicalSessions);
});
```

### Using `GetPatientHistory`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getPatientHistoryRef, GetPatientHistoryVariables } from '@urkio/dataconnect';

// The `GetPatientHistory` query requires an argument of type `GetPatientHistoryVariables`:
const getPatientHistoryVars: GetPatientHistoryVariables = {
  patientId: ..., 
};

// Call the `getPatientHistoryRef()` function to get a reference to the query.
const ref = getPatientHistoryRef(getPatientHistoryVars);
// Variables can be defined inline as well.
const ref = getPatientHistoryRef({ patientId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getPatientHistoryRef(dataConnect, getPatientHistoryVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.clinicalSessions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.clinicalSessions);
});
```

## SearchSessions
You can execute the `SearchSessions` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
searchSessions(vars: SearchSessionsVariables): QueryPromise<SearchSessionsData, SearchSessionsVariables>;

interface SearchSessionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SearchSessionsVariables): QueryRef<SearchSessionsData, SearchSessionsVariables>;
}
export const searchSessionsRef: SearchSessionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
searchSessions(dc: DataConnect, vars: SearchSessionsVariables): QueryPromise<SearchSessionsData, SearchSessionsVariables>;

interface SearchSessionsRef {
  ...
  (dc: DataConnect, vars: SearchSessionsVariables): QueryRef<SearchSessionsData, SearchSessionsVariables>;
}
export const searchSessionsRef: SearchSessionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the searchSessionsRef:
```typescript
const name = searchSessionsRef.operationName;
console.log(name);
```

### Variables
The `SearchSessions` query requires an argument of type `SearchSessionsVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SearchSessionsVariables {
  queryText: string;
}
```
### Return Type
Recall that executing the `SearchSessions` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SearchSessionsData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SearchSessionsData {
  clinicalSessions_transcriptEmbedding_similarity: ({
    id: UUIDString;
    sessionDate: TimestampString;
    summary?: string | null;
    patient: {
      clientName: string;
      caseCode: string;
    };
  } & ClinicalSession_Key)[];
}
```
### Using `SearchSessions`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, searchSessions, SearchSessionsVariables } from '@urkio/dataconnect';

// The `SearchSessions` query requires an argument of type `SearchSessionsVariables`:
const searchSessionsVars: SearchSessionsVariables = {
  queryText: ..., 
};

// Call the `searchSessions()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await searchSessions(searchSessionsVars);
// Variables can be defined inline as well.
const { data } = await searchSessions({ queryText: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await searchSessions(dataConnect, searchSessionsVars);

console.log(data.clinicalSessions_transcriptEmbedding_similarity);

// Or, you can use the `Promise` API.
searchSessions(searchSessionsVars).then((response) => {
  const data = response.data;
  console.log(data.clinicalSessions_transcriptEmbedding_similarity);
});
```

### Using `SearchSessions`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, searchSessionsRef, SearchSessionsVariables } from '@urkio/dataconnect';

// The `SearchSessions` query requires an argument of type `SearchSessionsVariables`:
const searchSessionsVars: SearchSessionsVariables = {
  queryText: ..., 
};

// Call the `searchSessionsRef()` function to get a reference to the query.
const ref = searchSessionsRef(searchSessionsVars);
// Variables can be defined inline as well.
const ref = searchSessionsRef({ queryText: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = searchSessionsRef(dataConnect, searchSessionsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.clinicalSessions_transcriptEmbedding_similarity);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.clinicalSessions_transcriptEmbedding_similarity);
});
```

## GetSpecialistDetails
You can execute the `GetSpecialistDetails` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
getSpecialistDetails(vars: GetSpecialistDetailsVariables): QueryPromise<GetSpecialistDetailsData, GetSpecialistDetailsVariables>;

interface GetSpecialistDetailsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetSpecialistDetailsVariables): QueryRef<GetSpecialistDetailsData, GetSpecialistDetailsVariables>;
}
export const getSpecialistDetailsRef: GetSpecialistDetailsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getSpecialistDetails(dc: DataConnect, vars: GetSpecialistDetailsVariables): QueryPromise<GetSpecialistDetailsData, GetSpecialistDetailsVariables>;

interface GetSpecialistDetailsRef {
  ...
  (dc: DataConnect, vars: GetSpecialistDetailsVariables): QueryRef<GetSpecialistDetailsData, GetSpecialistDetailsVariables>;
}
export const getSpecialistDetailsRef: GetSpecialistDetailsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getSpecialistDetailsRef:
```typescript
const name = getSpecialistDetailsRef.operationName;
console.log(name);
```

### Variables
The `GetSpecialistDetails` query requires an argument of type `GetSpecialistDetailsVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetSpecialistDetailsVariables {
  uid: string;
}
```
### Return Type
Recall that executing the `GetSpecialistDetails` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetSpecialistDetailsData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetSpecialistDetailsData {
  specialists: ({
    id: UUIDString;
    displayName: string;
    characterAssetId?: string | null;
  } & Specialist_Key)[];
}
```
### Using `GetSpecialistDetails`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getSpecialistDetails, GetSpecialistDetailsVariables } from '@urkio/dataconnect';

// The `GetSpecialistDetails` query requires an argument of type `GetSpecialistDetailsVariables`:
const getSpecialistDetailsVars: GetSpecialistDetailsVariables = {
  uid: ..., 
};

// Call the `getSpecialistDetails()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getSpecialistDetails(getSpecialistDetailsVars);
// Variables can be defined inline as well.
const { data } = await getSpecialistDetails({ uid: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getSpecialistDetails(dataConnect, getSpecialistDetailsVars);

console.log(data.specialists);

// Or, you can use the `Promise` API.
getSpecialistDetails(getSpecialistDetailsVars).then((response) => {
  const data = response.data;
  console.log(data.specialists);
});
```

### Using `GetSpecialistDetails`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getSpecialistDetailsRef, GetSpecialistDetailsVariables } from '@urkio/dataconnect';

// The `GetSpecialistDetails` query requires an argument of type `GetSpecialistDetailsVariables`:
const getSpecialistDetailsVars: GetSpecialistDetailsVariables = {
  uid: ..., 
};

// Call the `getSpecialistDetailsRef()` function to get a reference to the query.
const ref = getSpecialistDetailsRef(getSpecialistDetailsVars);
// Variables can be defined inline as well.
const ref = getSpecialistDetailsRef({ uid: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getSpecialistDetailsRef(dataConnect, getSpecialistDetailsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.specialists);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.specialists);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `clinical-connector` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateClinicalSession
You can execute the `CreateClinicalSession` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
createClinicalSession(vars: CreateClinicalSessionVariables): MutationPromise<CreateClinicalSessionData, CreateClinicalSessionVariables>;

interface CreateClinicalSessionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateClinicalSessionVariables): MutationRef<CreateClinicalSessionData, CreateClinicalSessionVariables>;
}
export const createClinicalSessionRef: CreateClinicalSessionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createClinicalSession(dc: DataConnect, vars: CreateClinicalSessionVariables): MutationPromise<CreateClinicalSessionData, CreateClinicalSessionVariables>;

interface CreateClinicalSessionRef {
  ...
  (dc: DataConnect, vars: CreateClinicalSessionVariables): MutationRef<CreateClinicalSessionData, CreateClinicalSessionVariables>;
}
export const createClinicalSessionRef: CreateClinicalSessionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createClinicalSessionRef:
```typescript
const name = createClinicalSessionRef.operationName;
console.log(name);
```

### Variables
The `CreateClinicalSession` mutation requires an argument of type `CreateClinicalSessionVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateClinicalSessionVariables {
  patientId: UUIDString;
  specialistId: UUIDString;
  transcript: string;
  summary?: string | null;
  sentiment?: number | null;
  keywords?: string[] | null;
}
```
### Return Type
Recall that executing the `CreateClinicalSession` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateClinicalSessionData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateClinicalSessionData {
  clinicalSession_insert: ClinicalSession_Key;
}
```
### Using `CreateClinicalSession`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createClinicalSession, CreateClinicalSessionVariables } from '@urkio/dataconnect';

// The `CreateClinicalSession` mutation requires an argument of type `CreateClinicalSessionVariables`:
const createClinicalSessionVars: CreateClinicalSessionVariables = {
  patientId: ..., 
  specialistId: ..., 
  transcript: ..., 
  summary: ..., // optional
  sentiment: ..., // optional
  keywords: ..., // optional
};

// Call the `createClinicalSession()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createClinicalSession(createClinicalSessionVars);
// Variables can be defined inline as well.
const { data } = await createClinicalSession({ patientId: ..., specialistId: ..., transcript: ..., summary: ..., sentiment: ..., keywords: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createClinicalSession(dataConnect, createClinicalSessionVars);

console.log(data.clinicalSession_insert);

// Or, you can use the `Promise` API.
createClinicalSession(createClinicalSessionVars).then((response) => {
  const data = response.data;
  console.log(data.clinicalSession_insert);
});
```

### Using `CreateClinicalSession`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createClinicalSessionRef, CreateClinicalSessionVariables } from '@urkio/dataconnect';

// The `CreateClinicalSession` mutation requires an argument of type `CreateClinicalSessionVariables`:
const createClinicalSessionVars: CreateClinicalSessionVariables = {
  patientId: ..., 
  specialistId: ..., 
  transcript: ..., 
  summary: ..., // optional
  sentiment: ..., // optional
  keywords: ..., // optional
};

// Call the `createClinicalSessionRef()` function to get a reference to the mutation.
const ref = createClinicalSessionRef(createClinicalSessionVars);
// Variables can be defined inline as well.
const ref = createClinicalSessionRef({ patientId: ..., specialistId: ..., transcript: ..., summary: ..., sentiment: ..., keywords: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createClinicalSessionRef(dataConnect, createClinicalSessionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.clinicalSession_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.clinicalSession_insert);
});
```

## AssignPatient
You can execute the `AssignPatient` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
assignPatient(vars: AssignPatientVariables): MutationPromise<AssignPatientData, AssignPatientVariables>;

interface AssignPatientRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AssignPatientVariables): MutationRef<AssignPatientData, AssignPatientVariables>;
}
export const assignPatientRef: AssignPatientRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
assignPatient(dc: DataConnect, vars: AssignPatientVariables): MutationPromise<AssignPatientData, AssignPatientVariables>;

interface AssignPatientRef {
  ...
  (dc: DataConnect, vars: AssignPatientVariables): MutationRef<AssignPatientData, AssignPatientVariables>;
}
export const assignPatientRef: AssignPatientRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the assignPatientRef:
```typescript
const name = assignPatientRef.operationName;
console.log(name);
```

### Variables
The `AssignPatient` mutation requires an argument of type `AssignPatientVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AssignPatientVariables {
  clientName: string;
  caseCode: string;
  specialistId: UUIDString;
}
```
### Return Type
Recall that executing the `AssignPatient` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AssignPatientData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AssignPatientData {
  patient_insert: Patient_Key;
}
```
### Using `AssignPatient`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, assignPatient, AssignPatientVariables } from '@urkio/dataconnect';

// The `AssignPatient` mutation requires an argument of type `AssignPatientVariables`:
const assignPatientVars: AssignPatientVariables = {
  clientName: ..., 
  caseCode: ..., 
  specialistId: ..., 
};

// Call the `assignPatient()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await assignPatient(assignPatientVars);
// Variables can be defined inline as well.
const { data } = await assignPatient({ clientName: ..., caseCode: ..., specialistId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await assignPatient(dataConnect, assignPatientVars);

console.log(data.patient_insert);

// Or, you can use the `Promise` API.
assignPatient(assignPatientVars).then((response) => {
  const data = response.data;
  console.log(data.patient_insert);
});
```

### Using `AssignPatient`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, assignPatientRef, AssignPatientVariables } from '@urkio/dataconnect';

// The `AssignPatient` mutation requires an argument of type `AssignPatientVariables`:
const assignPatientVars: AssignPatientVariables = {
  clientName: ..., 
  caseCode: ..., 
  specialistId: ..., 
};

// Call the `assignPatientRef()` function to get a reference to the mutation.
const ref = assignPatientRef(assignPatientVars);
// Variables can be defined inline as well.
const ref = assignPatientRef({ clientName: ..., caseCode: ..., specialistId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = assignPatientRef(dataConnect, assignPatientVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.patient_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.patient_insert);
});
```

