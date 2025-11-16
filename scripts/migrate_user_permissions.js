// Migration script to add write permission to user documents so users can edit their own profile.
// Usage:
// APPWRITE_ENDPOINT=https://[HOST]/v1 APPWRITE_PROJECT=[PROJECT_ID] APPWRITE_KEY=[API_KEY] DATABASE_ID=[DB_ID] USER_COLLECTION_ID=[COLLECTION_ID] node scripts/migrate_user_permissions.js

(async () => {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT;
  const apiKey = process.env.APPWRITE_KEY;
  const databaseId = process.env.DATABASE_ID;
  const collectionId = process.env.USER_COLLECTION_ID;

  if (!endpoint || !project || !apiKey || !databaseId || !collectionId) {
    console.error('Missing required env vars. See script header for usage.');
    process.exit(1);
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': project,
    'X-Appwrite-Key': apiKey,
  };

  try {
    // list documents
    const listRes = await fetch(`${endpoint}/databases/${databaseId}/collections/${collectionId}/documents`, {
      method: 'GET',
      headers,
    });
    if (!listRes.ok) throw new Error(`Failed to list documents: ${listRes.status} ${await listRes.text()}`);
    const listJson = await listRes.json();
    const documents = listJson.documents || [];
    console.log(`Found ${documents.length} documents`);

    for (const doc of documents) {
      const docId = doc.$id;
      // accountId field may vary; try common names
      const accountId = doc.accountId || doc.accountID || doc.account || doc.AccountId;
      if (!accountId) {
        console.warn(`Skipping ${docId}: accountId not found on document`);
        continue;
      }

      const body = JSON.stringify({ permissions: { read: ['*'], write: [`user:${accountId}`] } });

      const patchRes = await fetch(`${endpoint}/databases/${databaseId}/collections/${collectionId}/documents/${docId}`, {
        method: 'PATCH',
        headers,
        body,
      });

      if (!patchRes.ok) {
        console.error(`Failed to update doc ${docId}: ${patchRes.status} ${await patchRes.text()}`);
      } else {
        console.log(`Updated permissions for ${docId}`);
      }
    }

    console.log('Migration complete');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
