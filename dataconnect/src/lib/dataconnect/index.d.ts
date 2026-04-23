import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AssignPatientData {
  patient_insert: Patient_Key;
}

export interface AssignPatientVariables {
  clientName: string;
  caseCode: string;
  specialistId: UUIDString;
}

export interface ClinicalSession_Key {
  id: UUIDString;
  __typename?: 'ClinicalSession_Key';
}

export interface CreateClinicalSessionData {
  clinicalSession_insert: ClinicalSession_Key;
}

export interface CreateClinicalSessionVariables {
  patientId: UUIDString;
  specialistId: UUIDString;
  transcript: string;
  summary?: string | null;
  sentiment?: number | null;
  keywords?: string[] | null;
}

export interface GetPatientHistoryData {
  clinicalSessions: ({
    id: UUIDString;
    sessionDate: TimestampString;
    summary?: string | null;
    emotionalSentiment?: number | null;
    keywordsOfConcern?: string[] | null;
  } & ClinicalSession_Key)[];
}

export interface GetPatientHistoryVariables {
  patientId: UUIDString;
}

export interface GetSpecialistDetailsData {
  specialists: ({
    id: UUIDString;
    displayName: string;
    characterAssetId?: string | null;
  } & Specialist_Key)[];
}

export interface GetSpecialistDetailsVariables {
  uid: string;
}

export interface Patient_Key {
  id: UUIDString;
  __typename?: 'Patient_Key';
}

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

export interface SearchSessionsVariables {
  queryText: string;
}

export interface Specialist_Key {
  id: UUIDString;
  __typename?: 'Specialist_Key';
}

interface CreateClinicalSessionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateClinicalSessionVariables): MutationRef<CreateClinicalSessionData, CreateClinicalSessionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateClinicalSessionVariables): MutationRef<CreateClinicalSessionData, CreateClinicalSessionVariables>;
  operationName: string;
}
export const createClinicalSessionRef: CreateClinicalSessionRef;

export function createClinicalSession(vars: CreateClinicalSessionVariables): MutationPromise<CreateClinicalSessionData, CreateClinicalSessionVariables>;
export function createClinicalSession(dc: DataConnect, vars: CreateClinicalSessionVariables): MutationPromise<CreateClinicalSessionData, CreateClinicalSessionVariables>;

interface AssignPatientRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AssignPatientVariables): MutationRef<AssignPatientData, AssignPatientVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AssignPatientVariables): MutationRef<AssignPatientData, AssignPatientVariables>;
  operationName: string;
}
export const assignPatientRef: AssignPatientRef;

export function assignPatient(vars: AssignPatientVariables): MutationPromise<AssignPatientData, AssignPatientVariables>;
export function assignPatient(dc: DataConnect, vars: AssignPatientVariables): MutationPromise<AssignPatientData, AssignPatientVariables>;

interface GetPatientHistoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetPatientHistoryVariables): QueryRef<GetPatientHistoryData, GetPatientHistoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetPatientHistoryVariables): QueryRef<GetPatientHistoryData, GetPatientHistoryVariables>;
  operationName: string;
}
export const getPatientHistoryRef: GetPatientHistoryRef;

export function getPatientHistory(vars: GetPatientHistoryVariables): QueryPromise<GetPatientHistoryData, GetPatientHistoryVariables>;
export function getPatientHistory(dc: DataConnect, vars: GetPatientHistoryVariables): QueryPromise<GetPatientHistoryData, GetPatientHistoryVariables>;

interface SearchSessionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SearchSessionsVariables): QueryRef<SearchSessionsData, SearchSessionsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SearchSessionsVariables): QueryRef<SearchSessionsData, SearchSessionsVariables>;
  operationName: string;
}
export const searchSessionsRef: SearchSessionsRef;

export function searchSessions(vars: SearchSessionsVariables): QueryPromise<SearchSessionsData, SearchSessionsVariables>;
export function searchSessions(dc: DataConnect, vars: SearchSessionsVariables): QueryPromise<SearchSessionsData, SearchSessionsVariables>;

interface GetSpecialistDetailsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetSpecialistDetailsVariables): QueryRef<GetSpecialistDetailsData, GetSpecialistDetailsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetSpecialistDetailsVariables): QueryRef<GetSpecialistDetailsData, GetSpecialistDetailsVariables>;
  operationName: string;
}
export const getSpecialistDetailsRef: GetSpecialistDetailsRef;

export function getSpecialistDetails(vars: GetSpecialistDetailsVariables): QueryPromise<GetSpecialistDetailsData, GetSpecialistDetailsVariables>;
export function getSpecialistDetails(dc: DataConnect, vars: GetSpecialistDetailsVariables): QueryPromise<GetSpecialistDetailsData, GetSpecialistDetailsVariables>;

