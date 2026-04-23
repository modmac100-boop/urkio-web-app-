import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'clinical-connector',
  service: 'urkio-clinical-data',
  location: 'us-central1'
};

export const createClinicalSessionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateClinicalSession', inputVars);
}
createClinicalSessionRef.operationName = 'CreateClinicalSession';

export function createClinicalSession(dcOrVars, vars) {
  return executeMutation(createClinicalSessionRef(dcOrVars, vars));
}

export const assignPatientRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AssignPatient', inputVars);
}
assignPatientRef.operationName = 'AssignPatient';

export function assignPatient(dcOrVars, vars) {
  return executeMutation(assignPatientRef(dcOrVars, vars));
}

export const getPatientHistoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPatientHistory', inputVars);
}
getPatientHistoryRef.operationName = 'GetPatientHistory';

export function getPatientHistory(dcOrVars, vars) {
  return executeQuery(getPatientHistoryRef(dcOrVars, vars));
}

export const searchSessionsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SearchSessions', inputVars);
}
searchSessionsRef.operationName = 'SearchSessions';

export function searchSessions(dcOrVars, vars) {
  return executeQuery(searchSessionsRef(dcOrVars, vars));
}

export const getSpecialistDetailsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetSpecialistDetails', inputVars);
}
getSpecialistDetailsRef.operationName = 'GetSpecialistDetails';

export function getSpecialistDetails(dcOrVars, vars) {
  return executeQuery(getSpecialistDetailsRef(dcOrVars, vars));
}

