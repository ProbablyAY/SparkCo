import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export const SettingsPage = () => {
  const nav = useNavigate();
  const del = async () => { await api.delete('/me'); nav('/signup'); };
  return <div><h1 className="text-2xl mb-3">Settings</h1><AlertDialog.Root><AlertDialog.Trigger asChild><button className="bg-red-700">Delete account and all data</button></AlertDialog.Trigger><AlertDialog.Portal><AlertDialog.Overlay className="fixed inset-0 bg-black/50"/><AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 p-4 rounded"><AlertDialog.Title>Confirm delete</AlertDialog.Title><AlertDialog.Description>This permanently deletes your account and data.</AlertDialog.Description><div className="flex gap-2 mt-3"><AlertDialog.Cancel asChild><button>Cancel</button></AlertDialog.Cancel><AlertDialog.Action asChild><button className="bg-red-700" onClick={del}>Delete</button></AlertDialog.Action></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root></div>;
};
