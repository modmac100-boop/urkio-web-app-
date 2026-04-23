const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'clinical-connector',
  service: 'urkio-clinical-data',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const createClinicalSessionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateClinicalSession', inputVars);
}
createClinicalSessionRef.operationName = 'CreateClinicalSession';
exports.createClinicalSessionRef = createClinicalSessionRef;

exports.createClinicalSession = function createClinicalSession(dcOrVars, vars) {
  return executeMutation(createClinicalSessionRef(dcOrVars, vars));
};

const assignPatientRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AssignPatient', inputVars);
}
assignPatientRef.operationName = 'AssignPatient';
exports.assignPatientRef = assignPatientRef;

exports.assignPatient = function assignPatient(dcOrVars, vars) {
  return executeMutation(assignPatientRef(dcOrVars, vars));
};

const getPatientHistoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPatientHistory', inputVars);
}
getPatientHistoryRef.operationName = 'GetPatientHistory';
exports.getPatientHistoryRef = getPatientHistoryRef;

exports.getPatientHistory = function getPatientHistory(dcOrVars, vars) {
  return executeQuery(getPatientHistoryRef(dcOrVars, vars));
};

const searchSessionsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SearchSessions', inputVars);
}
searchSessionsRef.operationName = 'SearchSessions';
exports.searchSessionsRef = searchSessionsRef;

exports.searchSessions = function searchSessions(dcOrVars, vars) {
  return executeQuery(searchSessionsRef(dcOrVars, vars));
};

const getSpecialistDetailsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetSpecialistDetails', inputVars);
}
getSpecialistDetailsRef.operationName = 'GetSpecialistDetails';
exports.getSpecialistDetailsRef = getSpecialistDetailsRef;

exports.getSpecialistDetails = function getSpecialistDetails(dcOrVars, vars) {
  return executeQuery(getSpecialistDetailsRef(dcOrVars, vars));
};
