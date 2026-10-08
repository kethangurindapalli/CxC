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
  const [onlineUsers, setOnlineUsers] = useState(new Set());
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
      if(otherId && (senderId===otherId || receiverId===otherId)){
        setMessages(prev=> {
          if(prev.some(m=> m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        // Auto-mark as read when viewing
        if (!msg.read && senderId !== user?._id) {
          emit('markRead', { messageId: msg._id, otherUserId: senderId });
        }
      }
      loadConversations();
    };
    const off1 = on('newMessage', handleNew);
    const off2 = on('userTyping', ()=> setTyping(true));
    const off3 = on('userStopTyping', ()=> setTyping(false));
    const off4 = on('userOnline', ({ userId }) => setOnlineUsers(prev => new Set([...prev, userId])));
    const off5 = on('userOffline', ({ userId }) => setOnlineUsers(prev => { const next = new Set(prev); next.delete(userId); return next; }));
    const off6 = on('messageRead', ({ messageId, readBy }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, read: true } : m));
      setConversations(prev => prev.map(c => c.lastMessage?._id === messageId ? { ...c, lastMessage: { ...c.lastMessage, read: true } } : c));
    });
    return ()=>{ off1&&off1(); off2&&off2(); off3&&off3(); off4&&off4(); off5&&off5(); off6&&off6(); };
  },[socket, activeUser, user, emit, on]);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({ behavior:'smooth' }); },[messages]);

  const handleSend = async (e)=>{
    e.preventDefault();
    if(!input.trim() || !activeUser) return;
    const text=input; setInput('');
    try{
      if(socket?.connected){
        emit('sendMessage', { receiverId: activeUser, message: text });
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

  const isOnline = (uid) => onlineUsers.has(uid);

  return (
    <div className="container" style={{ padding:'1rem 0', display:'flex', gap:'1rem', height:'calc(100vh - 80px)' }}>
      <div className="card" style={{ width:'300px', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'1rem', borderBottom:'1px solid var(--border)', fontWeight:600 }}>Conversations</div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {conversations.length===0 ? <div style={{ padding:'1rem', color:'var(--text-secondary)', fontSize:'0.9rem' }}>No connections yet. <Link to="/connections">Connect</Link> to chat.</div> : conversations.map(c=>(
            <div key={c.user._id} onClick={()=> setActiveUser(c.user._id)} style={{ padding:'0.75rem 1rem', cursor:'pointer', background: activeUser===c.user._id?'var(--primary-light)':'transparent', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                <div style={{ position: 'relative', width:'32px', height:'32px', borderRadius:'50%', background:'var(--primary)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600, fontSize:'0.8rem' }}>
                  {c.user.name?.charAt(0).toUpperCase()}
                  {isOnline(c.user._id) && <span style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--surface)' }} />}
                </div>
                <div>
                  <div style={{ fontWeight:500, fontSize:'0.9rem' }}>{c.user.name} {isOnline(c.user._id) && <span style={{ fontSize: '0.7rem', color: 'var(--success)', marginLeft: '0.25rem' }}>●</span>}</div>
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
            <div style={{ padding:'1rem', borderBottom:'1px solid var(--border)', fontWeight:600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {conversations.find(c=>c.user._id===activeUser)?.user.name || activeUser}
              {isOnline(activeUser) && <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 500 }}>● Online</span>}
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'1rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {messages.map(m=> {
                const isMe = (m.sender._id||m.sender) === user._id;
                return (
                <div key={m._id} style={{ alignSelf: isMe?'flex-end':'flex-start', background: isMe?'var(--primary)':'var(--background)', color: isMe?'white':'var(--text-primary)', padding:'0.5rem 0.75rem', borderRadius:'12px', maxWidth:'70%', fontSize:'0.9rem' }}>
                  <div>{m.message}</div>
                  <div style={{ fontSize:'0.7rem', opacity:0.7, marginTop:'0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {new Date(m.createdAt).toLocaleTimeString()}
                    {isMe && m.read && <span style={{ color: isMe ? 'white' : 'var(--success)' }}>✓✓</span>}
                    {isMe && !m.read && <span style={{ color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>✓</span>}
                  </div>
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
