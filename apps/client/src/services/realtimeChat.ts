import { collection, addDoc, onSnapshot, query, orderBy, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { ChatMessage, Contact } from '@self-learning/types';

function conversationId(userA: string, userB: string): string {
  return [userA, userB].sort().join('_');
}

export const realtimeChatService = {
  sendMessage: async (userId: string, contactId: string, content: string) => {
    // 暫時禁用 Firebase 功能
    console.warn('Firebase is disabled - sendMessage not available');
    return;
    
    // const convId = conversationId(userId, contactId);
    // await addDoc(collection(db, 'conversations', convId, 'messages'), {
    //   senderId: userId,
    //   receiverId: contactId,
    //   content,
    //   timestamp: Date.now(),
    // });
  },

  listenMessages: (
    userId: string,
    contactId: string,
    callback: (messages: ChatMessage[]) => void,
  ) => {
    // 暫時禁用 Firebase 功能
    console.warn('Firebase is disabled - listenMessages not available');
    callback([]);
    return () => {}; // 返回空的 unsubscribe 函數
    
    // const convId = conversationId(userId, contactId);
    // const q = query(
    //   collection(db, 'conversations', convId, 'messages'),
    //   orderBy('timestamp'),
    // );
    // return onSnapshot(q, snap => {
    //   const msgs = snap.docs.map(d => ({ ...(d.data() as ChatMessage), id: d.id }));
    //   callback(msgs);
    // });
  },

  addContact: async (userId: string, contact: Contact) => {
    // 暫時禁用 Firebase 功能
    console.warn('Firebase is disabled - addContact not available');
    return;
    
    // await setDoc(doc(db, 'users', userId, 'contacts', contact.id), contact);
  },

  listenContacts: (userId: string, callback: (contacts: Contact[]) => void) => {
    // 暫時禁用 Firebase 功能
    console.warn('Firebase is disabled - listenContacts not available');
    callback([]);
    return () => {}; // 返回空的 unsubscribe 函數
    
    // const q = collection(db, 'users', userId, 'contacts');
    // return onSnapshot(q, snap => {
    //   const contacts = snap.docs.map(d => ({ ...(d.data() as Contact), id: d.id }));
    //   callback(contacts);
    // });
  },
};
