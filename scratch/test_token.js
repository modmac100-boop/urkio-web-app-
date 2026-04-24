import { RtcTokenBuilder, RtcRole } from 'agora-token';

const appId = "a5557dd007124b7aa7dfce0e3d61a7da";
const appCertificate = "63e7a05a48ac41e5af746e75d0dbdfac";
const channelName = "test-channel";
const uid = 12345;
const expirationTimestamp = Math.floor(Date.now() / 1000) + 3600;

const token = RtcTokenBuilder.buildTokenWithUid(
  appId,
  appCertificate,
  channelName,
  uid,
  RtcRole.PUBLISHER,
  expirationTimestamp,
  expirationTimestamp
);

console.log("Token:", token);
