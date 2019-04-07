import SQLite from 'react-native-sqlite-storage'

let instance

if (__DEV__) {
  SQLite.DEBUG(true)
}

SQLite.enablePromise(true)
SQLite.openDatabase({ name: 'hooligram-v2-client.db' })
  .then((db) => {
    instance = db
  })
  .then(() => {
    instance.executeSql(`
      CREATE TABLE IF NOT EXISTS contact (
        sid TEXT PRIMARY KEY,
        added INTEGER DEFAULT 0
      );
    `)
  })
  .then(() => {
    instance.executeSql(`
      CREATE TABLE IF NOT EXISTS message_group (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        date_created TEXT NOT NULL
      );
    `)
  })
  .then(() => {
    instance.executeSql(`
      CREATE TABLE IF NOT EXISTS message_group_contact (
        message_group_id INTEGER NOT NULL,
        contact_sid TEXT NOT NULL,
        PRIMARY KEY ( message_group_id, contact_sid ),
        FOREIGN KEY ( message_group_id ) REFERENCES message_group ( id )
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        FOREIGN KEY ( contact_sid ) REFERENCES contact ( sid )
      );
    `)
  })
  .then(() => {
    instance.executeSql(`
      CREATE TABLE IF NOT EXISTS message (
        id INTEGER PRIMARY KEY,
        content TEXT NOT NULL,
        date_created TEXT NOT NULL,
        message_group_id INTEGER NOT NULL,
        sender_sid INTEGER NOT NULL,
        FOREIGN KEY ( message_group_id ) REFERENCES message_group ( id )
        FOREIGN KEY ( sender_sid ) REFERENCES contact ( sid )
      );
    `)
  })
  .catch((err) => {
    console.log('error creating table. ', err.toString())
  })

////////////
// CREATE //
////////////

export const createContact = async (sid) => {
  if (!instance) return Promise.reject(new Error('db instance error'))

  return instance.executeSql('INSERT OR IGNORE INTO contact ( sid ) VALUES ( ? );', [sid])
    .then((res) => {
      return res
    })
    .catch((err) => {
      console.log('error creating contact.', err.toString())
    })
}

export const createMessage = async (id, content, dateCreated, messageGroupId, senderSid) => {
  if (!instance) return Promise.reject(new Error('db instance error'))

  return instance.executeSql(`
    INSERT OR REPLACE INTO message ( id, content, date_created, message_group_id, sender_sid )
    VALUES ( ?, ?, ?, ?, ? );
  `, [id, content, dateCreated, messageGroupId, senderSid])
}

export const createMessageGroup = async (id, name, dateCreated, contactSids) => {
  if (!instance) return Promise.reject(new Error('db instance error'))

  return instance
    .transaction((tx) => {
      tx.executeSql(`
        INSERT OR REPLACE INTO message_group ( id, name, date_created ) VALUES ( ?, ?, ? );
      `, [id, name, dateCreated])

      contactSids.forEach((sid) => {
        tx.executeSql('INSERT OR IGNORE INTO contact ( sid ) VALUES ( ? );', [sid])
      })
    })
    .catch((err) => {
      console.log('error creating message group.' + err.toString())
    })
}

//////////
// READ //
//////////

export const readContacts = async () => {
  if (!instance) return Promise.reject(new Error('db instance error'))

  return instance.executeSql('SELECT sid, added FROM contact;')
    .then(([results]) => {
      const contacts = []

      for (let i = 0; i < results.rows.length; i++) {
        contacts.push(results.rows.item(i))
      }

      return contacts
    })
    .catch((err) => {
      console.log('error reading contacts.', err.toString())
    })
}

export const readMessageGroups = async () => {
  if (!instance) return Promise.reject(new Error('db instance error'))

  return instance
    .executeSql('SELECT id, name, date_created FROM message_group;')
    .then(([results]) => {
      const messageGroups = []

      for (let i = 0; i < results.rows.length; i++) {
        messageGroups.push(results.rows.item(i))
      }

      return messageGroups
    })
}

export const readMessages = async (groupId) => {
  if (!instance) return Promise.reject(new Error('db instance error'))

  return instance.executeSql(`
    SELECT id, content, date_created, message_group_id, sender_sid
    FROM message
    WHERE message_group_id = ?;
  `, [groupId])
    .then(([results]) => {
      const messages = []

      for (let i =0; i < results.rows.length; i++) {
        messages.push(results.rows.item(i))
      }

      return messages
    })
}

////////////
// UPDATE //
////////////

export const updateContactAdded = async (sid, added = true) => {
  if (!instance) return Promise.reject(new Error('db instance error'))

  return instance.executeSql('UPDATE contact SET added = ? WHERE sid = ?;', [added ? 1 : 0, sid])
}

////////////
// DELETE //
////////////

export const deleteMessageGroup = async (id) => {
  if (!instance) return Promise.reject(new Error('db instance error'))

  return instance.executeSql('DELETE FROM message_group WHERE id = ?;', [id])
}
