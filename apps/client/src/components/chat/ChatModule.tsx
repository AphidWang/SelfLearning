import React, { useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { realtimeChatService } from '../../services/realtimeChat';
import type { Contact, ChatMessage } from '@self-learning/types';

const ChatModule: React.FC = () => {
  const { currentUser } = useUser();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newContactId, setNewContactId] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const unsub = realtimeChatService.listenContacts(currentUser.id, setContacts);
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !selected) return;
    const unsub = realtimeChatService.listenMessages(
      currentUser.id,
      selected.id,
      setMessages,
    );
    return () => unsub();
  }, [currentUser, selected]);

  const send = async () => {
    if (!currentUser || !selected || !text.trim()) return;
    await realtimeChatService.sendMessage(currentUser.id, selected.id, text.trim());
    setText('');
  };

  const addContact = async () => {
    if (!currentUser || !newContactId.trim()) return;
    const contact: Contact = { id: newContactId.trim(), name: newContactId.trim() };
    await realtimeChatService.addContact(currentUser.id, contact);
    setNewContactId('');
  };

  if (!currentUser) return null;

  return (
    <div className="p-4 border rounded-md bg-white dark:bg-gray-800">
      <h2 className="text-lg font-semibold mb-2">即時聊天</h2>
      <div className="flex">
        <div className="w-1/3 pr-2 border-r">
          <h3 className="font-medium mb-2">聯絡人</h3>
          <ul className="space-y-1">
            {contacts.map(c => (
              <li key={c.id}>
                <button
                  className={`w-full text-left p-1 rounded ${selected?.id === c.id ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  onClick={() => setSelected(c)}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex">
            <input
              value={newContactId}
              onChange={e => setNewContactId(e.target.value)}
              className="flex-1 border rounded p-1 text-sm"
              placeholder="聯絡人ID"
            />
            <button onClick={addContact} className="ml-1 px-2 bg-blue-500 text-white rounded">
              新增
            </button>
          </div>
        </div>
        <div className="flex-1 pl-2">
          {selected ? (
            <div className="flex flex-col h-64">
              <div className="flex-1 overflow-y-auto mb-2 space-y-1">
                {messages.map(m => (
                  <div
                    key={m.id}
                    className={m.senderId === currentUser.id ? 'text-right' : 'text-left'}
                  >
                    <span className="inline-block bg-gray-200 dark:bg-gray-700 rounded px-2 py-1 text-sm">
                      {m.content}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex">
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  className="flex-1 border rounded p-1 text-sm"
                  placeholder="輸入訊息"
                />
                <button onClick={send} className="ml-1 px-2 bg-blue-500 text-white rounded">
                  送出
                </button>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">請選擇聯絡人開始聊天</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatModule;
