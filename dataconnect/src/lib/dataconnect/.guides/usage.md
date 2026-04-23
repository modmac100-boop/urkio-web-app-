# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createClinicalSession, assignPatient, getPatientHistory, searchSessions, getSpecialistDetails } from '@urkio/dataconnect';


// Operation CreateClinicalSession:  For variables, look at type CreateClinicalSessionVars in ../index.d.ts
const { data } = await CreateClinicalSession(dataConnect, createClinicalSessionVars);

// Operation AssignPatient:  For variables, look at type AssignPatientVars in ../index.d.ts
const { data } = await AssignPatient(dataConnect, assignPatientVars);

// Operation GetPatientHistory:  For variables, look at type GetPatientHistoryVars in ../index.d.ts
const { data } = await GetPatientHistory(dataConnect, getPatientHistoryVars);

// Operation SearchSessions:  For variables, look at type SearchSessionsVars in ../index.d.ts
const { data } = await SearchSessions(dataConnect, searchSessionsVars);

// Operation GetSpecialistDetails:  For variables, look at type GetSpecialistDetailsVars in ../index.d.ts
const { data } = await GetSpecialistDetails(dataConnect, getSpecialistDetailsVars);


```