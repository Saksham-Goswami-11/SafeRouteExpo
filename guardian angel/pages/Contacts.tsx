import React, { useState } from 'react';
import { UserPlus, MoreVertical, ShieldCheck, Trash2 } from 'lucide-react';
import { MOCK_CONTACTS } from '../constants';
import { Contact } from '../types';

export const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);

  const deleteContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  return (
    <div className="pb-32 pt-6 px-5">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display font-bold text-slate-900">Guardians</h2>
        <button className="w-10 h-10 bg-amba-100 text-amba-600 rounded-full flex items-center justify-center hover:bg-amba-200 transition-colors">
          <UserPlus className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-8 flex items-start">
        <ShieldCheck className="w-5 h-5 text-indigo-600 mr-3 mt-0.5" />
        <div>
          <h3 className="font-bold text-indigo-900 text-sm">Trusted Circle</h3>
          <p className="text-xs text-indigo-700 mt-1">
            These contacts will receive your real-time location and audio feed when SOS is triggered.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {contacts.map((contact) => (
          <div key={contact.id} className="bg-white rounded-2xl p-4 shadow-glass-sm border border-slate-100 flex items-center justify-between">
             <div className="flex items-center">
               <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-lg mr-4">
                 {contact.avatar || contact.name[0]}
               </div>
               <div>
                 <h3 className="font-bold text-slate-800">{contact.name}</h3>
                 <p className="text-xs text-slate-500">{contact.relation} • {contact.phone}</p>
               </div>
             </div>
             
             <button 
               onClick={() => deleteContact(contact.id)}
               className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
             >
               <Trash2 className="w-5 h-5" />
             </button>
          </div>
        ))}

        {contacts.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <p>No contacts added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};