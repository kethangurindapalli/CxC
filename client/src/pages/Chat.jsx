import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { messageAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Chat() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { socket, emit, on } = useSocket();
  const { error } = useToast();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [activeUser, setActiveUser] = useState(userId||null);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  const loadConversations = async ()=>{ try{ const r=await messageAPI.getConversations(); setConversations(r.data.conversations);}catch{} };
  const loadMessages = async (uid)=>{ try{ const r=await messageAPI.getMessages(uid); setMessages(r.data.messages); }catch(e){ error(e.response?.data?.message||'Cannot load messages (need connection)'); setMessages([]); } };

  useEffect(()=>{ loadConversations(); },[]);
  useEffect(()=>{ if(activeUser){ loadMessages(activeUser); emit('joinConversation', activeUser); } return ()=>{ if(activeUser) emit('leaveConversation', activeUser); }; },[activeUser]);
  useEffect(()=>{ if(userId) setActiveUser(userId); },[userId]);

  useEffect(()=>{
    if(!socket) return;
    const handleNew = (msg)=>{
      const otherId = activeUser;
      const senderId = msg.sender?._id?.toString() || msg.sender?.toString();
      const receiverId = msg.receiver?._id?.toString() || msg.receiver?.toString();
      const isRelevant = otherId && (senderId===otherId || receiverId===otherId || senderId===user?._id || receiverId===user?._id);
      // dedupe by _id and also show only if relevant or if conversation exists
      if(otherId && (senderId===otherId || receiverId===otherId)){
        setMessages(prev=> {
          if(prev.some(m=> m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      } else if (!otherId) {
        // not in conversation view, just update list
      }
      loadConversations();
    };
    const off1 = on('newMessage', handleNew);
    const off2 = on('userTyping', ()=> setTyping(true));
    const off3 = on('userStopTyping', ()=> setTyping(false));
    return ()=>{ off1&&off1(); off2&&off2(); off3&&off3(); };
  },[socket, activeUser, user]);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({ behavior:'smooth' }); },[messages]);

  const handleSend = async (e)=>{
    e.preventDefault();
    if(!input.trim() || !activeUser) return;
    const text=input; setInput('');
    try{
      // Try socket emit first for real-time, fallback to REST
      if(socket?.connected){
        emit('sendMessage', { receiverId: activeUser, message: text });
        // Optimistically also call REST? Socket handler will create message, but to ensure we have it, we wait for echo
      } else {
        const r=await messageAPI.sendMessage(activeUser, text);
        setMessages(prev=>[...prev, r.data.message]);
      }
    }catch{ error('Failed to send'); }
  };

  const handleInputChange = e=>{
    setInput(e.target.value);
    if(activeUser){ emit('typing', activeUser); clearTimeout(window._typingTimeout); window._typingTimeout=setTimeout(()=> emit('stopTyping', activeUser),1000); }
  };

  return (
    <div className="container" style={{ padding:'1rem 0', display:'flex', gap:'1rem', height:'calc(100vh - 80px)' }}>
      <div className="card" style={{ width:'300px', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'1rem', borderBottom:'1px solid var(--border)', fontWeight:600 }}>Conversations</div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {conversations.length===0 ? <div style={{ padding:'1rem', color:'var(--text-secondary)', fontSize:'0.9rem' }}>No connections yet. <Link to="/connections">Connect</Link> to chat.</div> : conversations.map(c=>(
            <div key={c.user._id} onClick={()=> setActiveUser(c.user._id)} style={{ padding:'0.75rem 1rem', cursor:'pointer', background: activeUser===c.user._id?'var(--primary-light)':'transparent', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'var(--primary)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600, fontSize:'0.8rem' }}>{c.user.name?.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight:500, fontSize:'0.9rem' }}>{c.user.name}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', maxWidth:'120px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.lastMessage?.message || 'No messages'}</div>
                </div>
              </div>
              {c.unreadCount>0 && <span className="badge badge-primary">{c.unreadCount}</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {!activeUser ? <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)' }}>Select a conversation</div> : (
          <>
            <div style={{ padding:'1rem', borderBottom:'1px solid var(--border)', fontWeight:600 }}>{conversations.find(c=>c.user._id===activeUser)?.user.name || activeUser}</div>
            <div style={{ flex:1, overflowY:'auto', padding:'1rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {messages.map(m=> {
                const isMe = (m.sender._id||m.sender) === user._id;
                return (
                <div key={m._id} style={{ alignSelf: isMe?'flex-end':'flex-start', background: isMe?'var(--primary)':'var(--background)', color: isMe?'white':'var(--text-primary)', padding:'0.5rem 0.75rem', borderRadius:'12px', maxWidth:'70%', fontSize:'0.9rem' }}>
                  <div>{m.message}</div>
                  <div style={{ fontSize:'0.7rem', opacity:0.7, marginTop:'0.2rem' }}>{new Date(m.createdAt).toLocaleTimeString()}</div>
                </div>
              )})}
              {typing && <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', fontStyle:'italic' }}>typing...</div>}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSend} style={{ display:'flex', gap:'0.5rem', padding:'1rem', borderTop:'1px solid var(--border)' }}>
              <input className="form-input" value={input} onChange={handleInputChange} placeholder="Type a message (only connected users)" style={{ flex:1 }} maxLength={2000} />
              <button type="submit" className="btn btn-primary">Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
