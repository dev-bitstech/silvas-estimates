import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Catalog = { id:number; category:string; trade:string; item:string; unit:string; default_cost:number; cost_type:string; active:boolean };
type Item = { id?:string; trade:string; item:string; unit:string; qty:number; unit_cost:number };
type Project = { id?:string; name:string; kind:'Interior'|'Exterior'; rooms:any[]; sides:any[]; notes?:string; photos?:string[] };

const ROOM_SUGGESTIONS = ['Living Room','Kitchen','Bedroom','Bathroom','Hallway','Laundry'];
const HOUSE_SIDES = ['Front','Back','Left','Right'];

export default function AppPage(){
  const [user, setUser] = useState<any>(null);
  const [margin, setMargin] = useState<number>(parseFloat(process.env.NEXT_PUBLIC_DEFAULT_MARGIN||'0.35'));
  const [mode, setMode] = useState<'Interior'|'Exterior'>('Interior');
  const [projectName, setProjectName] = useState('Example – Kitchen Refresh');
  const [rooms, setRooms] = useState<any[]>([{ name:'Kitchen' }]);
  const [sides, setSides] = useState<any[]>(HOUSE_SIDES.map(s=>({name:s})));
  const [items, setItems] = useState<Item[]>([]);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<Catalog[]>([]);
  const [role, setRole] = useState<'admin'|'field'>('field');
  const bucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'project-photos';

  useEffect(()=>{
    supabase.auth.getUser().then(({data})=>{
      if(!data.user){ location.href='/'; return; }
      setUser(data.user);
    });
  },[]);

  useEffect(()=>{
    supabase.from('catalog').select('*').then(({data})=>{
      if(data) setCatalog(data.filter(c=>c.active));
    });
  },[]);

  const seedFiltered = useMemo(()=>catalog.filter(r=>r.category===mode || r.category==='Both'),[catalog,mode]);
  const addItem = (c:Catalog)=> setItems(prev=>[...prev,{ trade:c.trade, item:c.item, unit:c.unit, qty:1, unit_cost:c.default_cost }]);

  const subtotal = useMemo(()=> items.reduce((acc,i)=>acc + (i.qty||0) * (role==='admin'?(i.unit_cost||0):0),0),[items, role]);
  const total = useMemo(()=> subtotal * (1+margin),[subtotal, margin]);

  async function saveProject(){
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) { alert('Login expirado'); return; }

    const proj:Project = { name:projectName, kind:mode, rooms, sides, notes, photos };
    const { data:project, error } = await supabase.from('projects').insert(proj).select().single();
    if(error){ alert(error.message); return; }

    const rows = items.map(i=>({
      project_id: project.id, trade:i.trade, item:i.item, unit:i.unit, qty:i.qty, unit_cost:i.unit_cost
    }));
    const { error: e2 } = await supabase.from('items').insert(rows);
    if(e2){ alert(e2.message); return; }

    alert('Projeto salvo.');
    if(project?.id) location.href = `/print?projectId=${project.id}`;
  }

  async function onPhotoSelected(files: FileList | null){
    if(!files || files.length===0) return;
    const { data: { user } } = await supabase.auth.getUser();
    if(!user){ alert('Login expirado'); return; }
    for (const f of Array.from(files)){
      const path = `${user.id}/${Date.now()}-${f.name}`;
      const { error } = await supabase.storage.from(bucket).upload(path, f, { upsert:false });
      if(error){ alert(error.message); continue; }
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      if(pub?.publicUrl) setPhotos(prev=>[...prev, pub.publicUrl]);
    }
  }

  return (
    <div style={{maxWidth:1100, margin:'24px auto', padding:'0 16px'}}>
      <div className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8}}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <img src="/logo.png" alt="Silva's Contracting" width={120} height={36}/>
          <div style={{fontSize:12, textTransform:'uppercase', color:'#6b7280'}}>Silva's Contracting</div>
          <h2 style={{fontSize:20, fontWeight:600}}>Estimates (Beta)</h2>
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <select className="input" style={{width:220}} value={role} onChange={e=>setRole(e.target.value as any)}>
            <option value="admin">Admin (see costs)</option>
            <option value="field">Field Crew (no costs)</option>
          </select>
          <button className="btn" onClick={()=>saveProject()}>Save</button>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 320px', gap:16, marginTop:16}}>
        <div className="card">
          <div style={{display:'flex', gap:12}}>
            <div style={{flex:1}}>
              <div>Project name</div>
              <input className="input" value={projectName} onChange={e=>setProjectName(e.target.value)} />
            </div>
            <div style={{width:200}}>
              <div>Estimate type</div>
              <select className="input" value={mode} onChange={e=>setMode(e.target.value as any)}>
                <option>Interior</option>
                <option>Exterior</option>
              </select>
            </div>
            {role==='admin' && (
              <div style={{width:160}}>
                <div>Margin</div>
                <input className="input" type="number" step="0.01" value={margin} onChange={e=>setMargin(parseFloat(e.target.value)||0} />
              </div>
            )}
          </div>

          {mode==='Interior' ? (
            <div style={{marginTop:12}}>
              <div>Add room</div>
              <input className="input" list="rooms" placeholder="Room name" onKeyDown={e=>{
                const el = e.currentTarget as HTMLInputElement;
                if(e.key==='Enter' && el.value.trim()){ setRooms([...rooms, {name:el.value.trim()}]); el.value=''; }
              }} />
              <datalist id="rooms">
                {ROOM_SUGGESTIONS.map(r=>(<option value={r} key={r} />))}
              </datalist>
              <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:8}}>
                {rooms.map((r,idx)=>(<div key={idx} className="badge">{r.name}</div>))}
              </div>
            </div>
          ):(
            <div style={{marginTop:12}}>
              <div>House sides</div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginTop:8}}>
                {HOUSE_SIDES.map(s=>(<div key={s} className="badge">{s}</div>))}
              </div>
            </div>
          )}

          <div style={{marginTop:16}}>
            <div>Add items</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8}}>
              {seedFiltered.map(s=>(
                <button key={s.id} className="card" style={{textAlign:'left'}} onClick={()=>addItem(s as any)}>
                  <div style={{fontWeight:600}}>{s.trade}</div>
                  <div>{s.item}</div>
                  <div style={{fontSize:12, color:'#6b7280'}}>{s.unit}{role==='admin' ? ` • $${s.default_cost}/unit` : ''}</div>
                </button>
              ))}
            </div>

            <div style={{marginTop:12, overflowX:'auto'}}>
              <table className="table">
                <thead>
                  <tr>
                    <th className="th">Trade / Item</th>
                    <th className="th">Unit</th>
                    <th className="th">Qty</th>
                    {role==='admin' && <th className="th">Unit Cost</th>}
                    {role==='admin' && <th className="th">Line Total</th>}
                    <th className="th"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i,idx)=>(
                    <tr key={idx}>
                      <td className="td">
                        <div style={{fontWeight:600}}>{i.trade}</div>
                        <div style={{color:'#6b7280'}}>{i.item}</div>
                      </td>
                      <td className="td">{i.unit}</td>
                      <td className="td">
                        <input className="input" type="number" min={0} value={i.qty} onChange={e=>{
                          const v = parseFloat(e.target.value)||0;
                          const copy = [...items]; copy[idx].qty = v; setItems(copy);
                        }} />
                      </td>
                      {role==='admin' && (
                        <td className="td">
                          <input className="input" type="number" step="0.01" min={0} value={i.unit_cost} onChange={e=>{
                            const v = parseFloat(e.target.value)||0;
                            const copy = [...items]; copy[idx].unit_cost = v; setItems(copy);
                          }} />
                        </td>
                      )}
                      {role==='admin' && (
                        <td className="td">${(i.qty||0)*(i.unit_cost||0)}</td>
                      )}
                      <td className="td"><button className="link" onClick={()=>{
                        const copy = items.filter((_,j)=>j!==idx); setItems(copy);
                      }}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{marginTop:16}}>
              <div><b>Photos</b></div>
              <input type="file" multiple onChange={e=>onPhotoSelected(e.currentTarget.files)} />
              <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:8}}>
                {photos.map((src,i)=>(
                  <img key={i} src={src} alt={"photo-"+i} style={{width:120, height:90, objectFit:'cover', borderRadius:8, border:'1px solid #e5e7eb'}}/>
                ))}
              </div>
            </div>

          </div>
        </div>

        <aside className="card" style={{height:'fit-content'}}>
          <div style={{fontSize:18, fontWeight:600}}>Summary</div>
          <div>Type: <b>{mode}</b></div>
          <div>Project: <b>{projectName}</b></div>
          <div style={{marginTop:8, borderTop:'1px solid #e5e7eb', paddingTop:8, fontSize:14}}>
            {role==='admin' ? (
              <>
                <div style={{display:'flex', justifyContent:'space-between'}}><span>Subtotal</span><b>${subtotal.toFixed(2)}</b></div>
                <div style={{display:'flex', justifyContent:'space-between'}}><span>Margin ({Math.round(margin*100)}%)</span><b>${(subtotal*margin).toFixed(2)}</b></div>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:18}}><span>Total</span><b>${(subtotal*(1+margin)).toFixed(2)}</b></div>
              </>
            ) : (
              <div style={{color:'#6b7280'}}>Costs hidden for field role.</div>
            )}
          </div>
          <div style={{marginTop:8}}>
            <div>General notes</div>
            <textarea className="input" rows={4} placeholder="Access hours, parking, dumpster, etc." value={notes} onChange={e=>setNotes(e.target.value)} />
          </div>
          <div style={{marginTop:8, fontSize:12, color:'#6b7280'}}>Checklist: take photos • verify access • parking/dumpster • building hours</div>
          <div style={{marginTop:12}}>
            <a className="link" href="#" onClick={(e)=>{ e.preventDefault(); window.open('/print','_blank'); }}>Preview for print/PDF</a>
          </div>
        </aside>
      </div>
    </div>
  );
}
