/* TransJogja ERP - logika aplikasi. Data: data/config.json & data/master.json */
const KAT=['Biaya Pokok','Biaya Pendukung','Pendapatan'],OPS=['AMI','JTT'];
let TABS=[],CFG,MASTER;
const $=id=>document.getElementById(id);
/* ---- hierarki: kategori utama > kelompok > sub kelompok > grup akun ---- */
const HL=['jenis','utama','kel','sub','grup'];
const ukey=m=>m.kode+' '+m.nama+(m.jenis==='Bus Listrik'?' [Listrik]':'');
const hp=m=>HL.map(k=>m[k]).filter((x,i,a)=>x&&x!==a[i-1]);
const fk=m=>hp(m).join('|');
const inF=m=>!S.f||fk(m)===S.f||fk(m).startsWith(S.f+'|');
let TN=[],LG='';
function treeNodes(){const out=[],seen={};
 S.m.forEach(m=>{const p=hp(m);p.forEach((lab,i)=>{const key=p.slice(0,i+1).join('|');
  if(!seen[key]){seen[key]={key,lab,d:i,n:0};out.push(seen[key])}seen[key].n++})});
 return out}
function setF(i){S.f=i<0?'':TN[i].key;save();draw()}
function treeHtml(){TN=treeNodes();const act=S.f||'';
 return '<div class="tr"><button class="d0'+(!act?' on':'')+'" onclick="setF(-1)">Semua komponen <i>'+S.m.length+'</i></button>'+TN.map((n,i)=>{
  const pk=n.key.slice(0,Math.max(0,n.key.lastIndexOf('|')));
  if(n.d>2&&!(act===pk||act.startsWith(pk+'|')))return '';
  return '<button class="d'+n.d+(n.key===act?' on':'')+'" onclick="setF('+i+')">'+esc(n.lab)+' <i>'+n.n+'</i></button>'}).join('')+'</div>'}
function crumb(){TN=treeNodes();const parts=S.f?S.f.split('|'):[];
 return `<div class="f"><label>Filter kelompok<select class="ok" onchange="setF(+this.value)"><option value="-1">Semua komponen</option>${TN.map((n,i)=>`<option value="${i}" ${n.key===S.f?'selected':''}>${'\u00a0\u00a0'.repeat(n.d)}${esc(n.lab)} (${n.n})</option>`).join('')}</select></label></div><div class="sub">${['Semua',...parts].map(esc).join(' › ')}</div>`}
const gh=m=>{const k=(m.jenis||'')+'|'+m.sub+'|'+m.grup;if(!m.grup||k===LG)return '';LG=k;return `<tr class="t3"><td colspan="12">${esc((m.jenis||'')+' › ')}${esc(m.sub&&m.sub!==m.grup?m.sub+' › ':'')}${esc(m.grup)}</td></tr>`};
let q='';
const mq=m=>!q||(m.kode+' '+m.nama+' '+(m.grup||'')).toLowerCase().includes(q);
const cq=c=>!q||(c.uraian+' '+c.op+' #'+c.id).toLowerCase().includes(q);
function srch(x){q=x.trim().toLowerCase();if((tab=='master'||tab=='ajuan')&&!ed)draw()}
let GUEST=false;
function enter(u,role){GUEST=role==='guest';$('lg').hidden=true;$('app').hidden=false;$('un').textContent=u;$('av').textContent=u[0].toUpperCase();$('ro').textContent=GUEST?'Tamu · hanya lihat':'Administrator';draw()}
function login(role){if(!S)return;const g=role==='guest',u=g?'Tamu':($('lu').value.trim()||'Administrator');
 try{sessionStorage.setItem('tjU',u);sessionStorage.setItem('tjR',g?'guest':'admin')}catch(e){}enter(u,g?'guest':'admin')}
function logout(){try{sessionStorage.removeItem('tjU')}catch(e){}$('app').hidden=true;$('lg').hidden=false}
let S,tab='dash',ed=null;
const seed=()=>({p:{...CFG.params},m:JSON.parse(JSON.stringify(MASTER)),c:[],n:0,mv:CFG.masterVersion});

const save=()=>{try{localStorage.setItem('erpTJ2',JSON.stringify(S))}catch(e){}};
const R=n=>(n<0?'-':'')+'Rp '+Math.abs(Math.round(n)).toLocaleString('id-ID');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sg=k=>k==='Pendapatan'?-1:1;
const ap=(m,o)=>(m.op==='BOTH'||m.op===o)&&!(o==='JTT'&&m.kat==='Pendapatan');
const katOk=(o,k)=>!(o==='JTT'&&k==='Pendapatan');
const go=t=>{tab=t;ed=null;draw()};
const v=id=>document.getElementById(id).value;

function draw(){
 const T=TABS.find(t=>t[0]==tab);
 $('nav').innerHTML=TABS.filter(t=>!(GUEST&&t[0]==='pgn')).map((t,i)=>`<button class="${t[0]==tab?'on':''}" onclick="go('${t[0]}')"><em>${pad(i+1)}</em>${t[1]}</button>${t[0]==='master'&&tab==='master'?treeHtml():''}`).join('');
 $('vw').innerHTML=`<div class="ph"><h1>${T[1]}</h1><p>${T[2]}</p>${['master','rka','ajuan','verif','akum','lap'].includes(tab)?`<button class="gh" onclick="exp('${tab}')">Ekspor Excel</button>`:''}</div>`+(GUEST?'<div class="note">Mode tamu: Anda dapat melihat laporan dan mengekspor, tetapi tidak dapat mengubah data.</div>':'')+({dash,master,rka,ajuan,verif,akum,lap:lapView,ba:baView,pgn:setView})[tab]();
 if(tab=='ajuan')katC();
 if(GUEST)document.querySelectorAll('#vw input:not(.ok),#vw select:not(.ok),#vw button.p:not(.ok),#vw button.x:not(.ok)').forEach(e=>e.disabled=true);
}
const sel=(id,a,fn)=>`<select id="${id}" ${fn?`onchange="${fn}"`:''}>${a.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('')}</select>`;

/* ---------- hitung ---------- */
function rkaRows(o){
 const f=12/S.p.b,g=1+S.p.g/100,i=1+S.p.i/100;
 return S.m.filter(m=>ap(m,o)&&(S.p.ev||m.sk!=='Evaluasi SK Gub')).map(m=>{const vol=Math.ceil(m.vol*f*g),h=m.harga*i,tot=vol*h;return{...m,vol27:vol,h27:h,tot,mar:m.margin?tot*S.p.mg/100:0}});
}
const rkaNet=o=>rkaRows(o).reduce((a,r)=>a+sg(r.kat)*(r.tot+r.mar),0);
const sel_=c=>c.acc==null?0:c.nilai-c.acc;
const kids=c=>S.c.filter(x=>x.parent===c.id);
const reN=c=>kids(c).reduce((a,x)=>a+x.nilai,0);
const avail=c=>c.acc==null?0:Math.max(0,sel_(c)-reN(c)-(c.tutup||0));
const sisa=c=>c.acc==null?0:sel_(c)-reN(c);
const pad=n=>String(n).padStart(2,'0'),ym=d=>d.getFullYear()+'-'+pad(d.getMonth()+1);
const nowYM=()=>ym(new Date()),nextYM=()=>{const d=new Date();return ym(new Date(d.getFullYear(),d.getMonth()+1,1))};

/* ---------- tampilan ---------- */
const cp=n=>n>=1e9?(n/1e9).toFixed(1)+' M':n>=1e6?(n/1e6).toFixed(1)+' jt':Math.round(n/1e3)+' rb';
function dash(){
 const yr=S.yr||new Date().getFullYear(),sum=f=>S.c.reduce((a,c)=>a+sg(c.kat)*f(c),0);
 const rkaT=rkaNet('AMI')+rkaNet('JTT'),aju=sum(c=>c.nilai),cair=sum(c=>c.acc||0),tk=sum(c=>sisa(c));
 const wait=S.c.filter(c=>c.acc==null),pct=rkaT?Math.round(cair/rkaT*1000)/10:0;
 const kpi=(i,l,b,s)=>`<div class="k"><span class="kl">${l}</span><b>${b}</b><span class="ks">${s}</span></div>`;
 const mons=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
 const dat=mons.map((_,i)=>{const key=yr+'-'+pad(i+1);return[yr==2027?rkaT/12:0,S.c.filter(c=>c.per===key).reduce((a,c)=>a+sg(c.kat)*(c.acc||0),0)]});
 const mx=Math.max(1,...dat.flat().map(Math.abs));
 const chart=dat.map((d,i)=>`<div class="cc"><div class="bw"><i class="b1" style="height:${Math.max(0,d[0])/mx*100}%"></i><i class="b2" style="height:${Math.max(0,d[1])/mx*100}%"></i></div><span>${mons[i]}</span></div>`).join('');
 const st=c=>c.acc==null?['Menunggu Verifikasi','b-w']:sel_(c)==0?['Disetujui','b-o']:[c.jenis,'b-e'];
 const act=S.c.slice(-6).reverse().map(c=>{const s=st(c);return `<div class="ac"><div>Pengajuan #${c.id} · ${esc(c.uraian)}</div><span class="bd ${s[1]}">${s[0]}</span><span class="sub" style="margin:0">${c.per}</span></div>`}).join('')||'<div class="sub">Belum ada pengajuan.</div>';
 const ot=['AMI','JTT'].map(o=>{const cs=S.c.filter(c=>c.op===o),n=f=>cs.reduce((a,c)=>a+sg(c.kat)*f(c),0);return `<tr><td>PT ${o}</td><td>${o==='AMI'?'Semua komponen':'Biaya Pokok + Pendukung'}</td><td class="n">${R(rkaNet(o))}</td><td class="n">${R(n(c=>c.nilai))}</td><td class="n o">${R(n(c=>c.acc||0))}</td><td class="n">${R(n(c=>c.acc==null?c.nilai:0))}</td><td class="n e">${R(n(c=>sisa(c)))}</td></tr>`}).join('');
 return `<div class="g">${kpi('💰','Total RKA 2027 (netto)',R(rkaT),'PT AMI + PT JTT')}${kpi('📈','Disetujui Dishub',R(cair),rkaT?pct+'% dari RKA 2027':'RKA belum terisi')}${kpi('📝','Pengajuan menunggu',wait.length,R(wait.reduce((a,c)=>a+sg(c.kat)*c.nilai,0)))}${kpi('📚','Akumulasi tidak cair',R(tk),'terbawa berkelanjutan')}</div>
 <div class="two"><div class="pn"><h3>RKA vs Disetujui per Bulan<select class="ok" onchange="S.yr=+this.value;draw()">${[2026,2027].map(y=>`<option ${y==yr?'selected':''}>${y}</option>`).join('')}</select></h3>
 <div class="lg2"><span><i class="dt b1"></i>RKA (per bulan)</span><span><i class="dt b2"></i>Disetujui Dishub</span><span style="margin-left:auto">skala maks ${cp(mx)}</span></div><div class="ch">${chart}</div></div>
 <div class="pn"><h3>Aktivitas Terbaru<a onclick="go('ajuan')">Lihat Semua →</a></h3>${act}</div></div>
 <div class="pn"><h3>Ringkasan per Operator</h3><div class="tw" style="border:0"><table><tr><th>Operator</th><th>Komponen</th><th class="n">RKA 2027</th><th class="n">Diajukan</th><th class="n">Disetujui</th><th class="n">Menunggu</th><th class="n">Akumulasi</th></tr>${ot}</table></div></div>
 <div class="note">Netto = Biaya Pokok + Biaya Pendukung − Pendapatan (hanya PT AMI). Pastikan sesuai ketentuan Pergub DIY 110/2024.</div>`;
}
function master(){
 const OL={BOTH:'AMI &amp; JTT',AMI:'PT AMI',JTT:'PT JTT'},kosong=S.m.filter(m=>!m.harga).length;
 LG='';const rows=S.m.filter(m=>mq(m)&&inF(m)).map(m=>gh(m)+`<tr><td>${esc(m.kode)}</td><td>${esc((m.jenis||'Bus Diesel').replace('Bus ',''))}</td><td>${m.kat}</td><td>${esc(m.grup||'')}</td><td>${esc(m.nama)}</td><td>${esc(m.sat)}</td><td>${OL[m.op]}</td><td>${m.margin?'7%':'-'}</td><td>${m.sk==='Evaluasi SK Gub'?'<span class="tg w">evaluasi SK</span>':'<span class="tg o">valid</span>'}</td><td><input type="number" min="0" size="10" value="${m.harga}" onchange="upM(${m.id},'harga',this.value)"></td><td><input type="number" min="0" size="6" value="${m.vol}" onchange="upM(${m.id},'vol',this.value)"></td><td><button class="x" onclick="delM(${m.id})">hapus</button></td></tr>`).join('');
 return `${crumb()}<div class="note">${S.m.length} komponen. <b>${kosong}</b> belum punya harga satuan. Isi kolom Harga dan Volume langsung di tabel (atau import file yang sudah berisi kolom harga dan volume).</div>
 <div class="f"><label>Import Excel/CSV<input type="file" accept=".xlsx,.xls,.csv" onchange="impM(this)"></label></div>
 <div class="f"><label>Kategori${sel('mk',KAT.map(k=>[k,k]))}</label>
 <label>Operator${sel('mo',[['BOTH','AMI & JTT'],['AMI','AMI'],['JTT','JTT']])}</label>
 <label>Grup akun (opsional)${sel('mg',[['','(tanpa grup)'],...[...new Set(S.m.map(m=>m.grup).filter(Boolean))].map(g=>[g,g])])}</label><label>Kode<input id="mc" size="8"></label><label>Uraian<input id="mn" size="22"></label>
 <label>Satuan<input id="ms" size="8"></label><label>Harga<input id="mh" type="number" min="0" size="9"></label>
 <label>Volume<input id="mv" type="number" min="0" size="6"></label><button class="p" onclick="addM()">Tambah</button></div>
 <div class="tw"><table><tr><th>Kode</th><th>Jenis</th><th>Kategori</th><th>Grup akun</th><th>Uraian</th><th>Satuan</th><th>Operator</th><th>Margin</th><th>Status SK</th><th>Harga</th><th>Volume</th><th></th></tr>${rows}</table></div>`;
}
function upM(id,f,val){S.m.find(x=>x.id===id)[f]=+val||0;save()}
function addM(){
 const m={id:Date.now(),kat:v('mk'),op:v('mo'),kode:v('mc'),nama:v('mn'),sat:v('ms'),harga:+v('mh')||0,vol:+v('mv')||0};
 if(!m.nama)return alert('Uraian wajib diisi');
 if(m.kat==='Pendapatan'&&m.op!=='AMI')return alert('Pendapatan hanya untuk PT AMI');
 m.sk='Valid';const gs=S.m.find(x=>x.grup&&x.grup===v('mg'));
 if(gs)Object.assign(m,{jenis:gs.jenis,utama:gs.utama,kel:gs.kel,sub:gs.sub,grup:gs.grup,kat:gs.kat});else{m.grup='';m.kel=m.kat;m.jenis='Bus Diesel'}
 if(m.kat==='Pendapatan'&&m.op!=='AMI')return alert('Pendapatan hanya untuk PT AMI');
 m.margin=m.kat==='Biaya Pokok';S.m.push(m);save();draw();
}
function delM(id){S.m=S.m.filter(m=>m.id!==id);save();draw()}
function impM(el){
 const f=el.files[0];if(!f)return;const r=new FileReader();
 r.onload=e=>{try{
  const wb=XLSX.read(e.target.result,{type:'array'}),rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  const nw=[];let n=0;rows.forEach(x=>{const k={};for(const a in x)k[a.toLowerCase().trim()]=x[a];
   const kt=String((k.kelompok_biaya||'')+' '+(k.kategori_utama||'')+' '+(k.kategori||'')).toLowerCase(),
   kat=kt.includes('pokok')?KAT[0]:kt.includes('dukung')?KAT[1]:kt.includes('pendapatan')?KAT[2]:null;
   const ot=String(k.operator_pengelola||k.operator||'').toUpperCase(),op=ot.includes('AMI')?'AMI':ot.includes('JTT')?'JTT':'BOTH';
   const nama=k.nama_komponen||k.nama;if(!kat||!nama||(kat===KAT[2]&&op!=='AMI'))return;
   nw.push({id:Date.now()+n++,kat,op,kode:String(k.kode_akun||k.kode||''),jenis:k.jenis_kendaraan||k.jenis||'Bus Diesel',utama:k.kategori_utama||'',kel:k.kelompok_biaya||'',sub:k.sub_kelompok||'',grup:k.grup_akun||'',nama,sat:k.satuan_dasar||k.satuan||'',harga:+(k.harga)||0,vol:+(k.volume)||0,margin:String(k.kena_margin_7_persen).toUpperCase()==='TRUE'||kat===KAT[0]&&k.kena_margin_7_persen==null,sk:k.status_sk_gub||'Valid'})});
  if(nw.length&&confirm(nw.length+' komponen terbaca. Ganti seluruh master dengan data ini? (OK = ganti, Batal = tambahkan)'))S.m=[];
  S.m.push(...nw);save();draw();
 }catch(err){alert('Gagal membaca file')}};
 r.readAsArrayBuffer(f);
}

function rkaGrp(a,k,fn){
 const tt=x=>x.reduce((s,r)=>s+r.tot+r.mar,0);
 const grp=(arr,key)=>{const o=[];arr.forEach(r=>{let g=o.find(x=>x.k===(r[key]||''));if(!g)o.push(g={k:r[key]||'',a:[]});g.a.push(r)});return o};
 return grp(a,'jenis').map(j=>`<tr class="t2"><td colspan="6">${esc(j.k)}</td><td class="n">${R(tt(j.a))}</td></tr>`+grp(j.a,'sub').map(s=>{
  const skip=!s.k||s.k.replace(/^\d+\.\s*/,'')===k;
  return (skip?'':`<tr class="t2"><td colspan="6">${esc(s.k)}</td><td class="n">${R(tt(s.a))}</td></tr>`)+grp(s.a,'grup').map(g=>(g.k?`<tr class="t3"><td colspan="6">${esc(g.k)}</td><td class="n">${R(tt(g.a))}</td></tr>`:'')+g.a.map(fn).join('')).join('')}).join('')).join('')}
function rka(){
 const p=S.p;
 const blok=o=>{const rs=rkaRows(o);let h='';
  KAT.filter(k=>katOk(o,k)).forEach(k=>{const a=rs.filter(r=>r.kat===k);if(!a.length)return;
   h+=`<tr class="t"><td colspan="7">${k}</td></tr>`+rkaGrp(a,k,r=>`<tr><td>${esc(r.kode)}</td><td>${esc(r.nama)}</td><td class="n">${r.vol27}</td><td class="n">${R(r.h27)}</td><td class="n">${R(r.tot)}</td><td class="n">${R(r.mar)}</td><td class="n">${R(r.tot+r.mar)}</td></tr>`)});
  return `<h2>PT ${o}</h2><div class="tw"><table><tr><th>Kode</th><th>Uraian</th><th class="n">Vol 2027</th><th class="n">Harga 2027</th><th class="n">Jumlah</th><th class="n">Margin</th><th class="n">Total</th></tr>${h}<tr class="t"><td colspan="6">Subsidi netto RKA 2027</td><td class="n">${R(rkaNet(o))}</td></tr></table></div>`};
 return `<div class="f"><label>Bulan data realisasi<input type="number" min="1" max="12" value="${p.b}" onchange="S.p.b=+this.value||10;save();draw()"></label>
 <label>Pertumbuhan volume %<input type="number" step="0.1" value="${p.g}" onchange="S.p.g=+this.value;save();draw()"></label>
 <label>Eskalasi harga %<input type="number" step="0.1" value="${p.i}" onchange="S.p.i=+this.value;save();draw()"></label>
 <label>Margin %<input type="number" step="0.1" value="${p.mg}" onchange="S.p.mg=+this.value;save();draw()"></label>
 <label><span>Sertakan komponen “Evaluasi SK Gub”</span><input type="checkbox" ${p.ev?'checked':''} onchange="S.p.ev=this.checked;save();draw()"></label></div>
 <div class="sub">Vol 2027 = volume ÷ bulan data × 12 × (1+pertumbuhan), dibulatkan ke atas. Harga 2027 = harga × (1+eskalasi). Margin hanya untuk komponen bertanda kena margin.</div>${blok('AMI')+blok('JTT')}
 <div class="note">Pengharum Bus dan Pengendalian Hama Bus berstatus “Evaluasi SK Gub” dan secara bawaan tidak dihitung. Parameter pertumbuhan dan eskalasi masih asumsi sementara sampai batas dari Pergub DIY 110/2024 dimasukkan.</div>`;
}

function ajuan(){
 const e=ed?S.c.find(c=>c.id===ed):null;
 const rows=S.c.slice().reverse().filter(cq).map(c=>`<tr><td>#${c.id}</td><td>${c.per}</td><td>${c.op}</td><td>${c.kat}</td><td>${esc(c.uraian)}${c.parent?` <span class="tg">ulang ←#${c.parent}</span>`:''}</td><td class="n">${R(c.nilai)}</td><td>${c.acc==null?'<span class="tg">menunggu</span>':'<span class="tg o">terverifikasi</span>'}</td><td>${c.acc==null?`<button class="x" style="color:var(--ac)" onclick="editC(${c.id})">edit</button> <button class="x" onclick="delC(${c.id})">hapus</button>`:''}</td></tr>`).join('');
 const sal=S.c.filter(c=>avail(c)>0).map(c=>`<tr><td>#${c.id}</td><td>${c.op}</td><td>${esc(c.uraian)}</td><td>${c.per}</td><td>${c.jenis}</td><td class="n">${R(avail(c))}</td><td><input id="s${c.id}" type="number" min="1" max="${avail(c)}" value="${avail(c)}" size="10"></td><td><button class="p" onclick="reC(${c.id})">Ajukan</button> <button class="x" onclick="tutC(${c.id})">tutup sisa</button></td></tr>`).join('');
 return `${bulkHtml()}<h2>${e?'Edit pengajuan #'+e.id:'Pengajuan baru'}</h2><div class="f"><label>Periode<input id="cp" type="month" value="${nowYM()}"></label>
 <label>Operator${sel('co',[['AMI','PT AMI'],['JTT','PT JTT']],'katC()')}</label>
 <label>Jenis kendaraan<select id="cj" onchange="subC()"><option>Bus Diesel</option><option>Bus Listrik</option></select></label><label>Komponen<select id="ck" onchange="subC()"></select></label><label>Sub kelompok<select id="cs" onchange="grpC()"></select></label><label>Grup akun<select id="cg" onchange="uraC()"></select></label>
 <label>Uraian biaya (dari master)<select id="cu" style="max-width:320px"></select></label><label>Nilai diajukan<input id="cn" type="number" min="0" size="12"></label>
 <button class="p" onclick="addC()">${e?'Simpan perubahan':'Ajukan'}</button>${e?'<button class="x" onclick="ed=null;draw()">batal</button>':''}</div>
 <div class="sub">PT AMI: semua komponen. PT JTT: hanya Biaya Pokok &amp; Biaya Pendukung (tanpa Pendapatan). Pengajuan yang sudah diverifikasi tidak bisa diedit; batalkan dulu di tab Verifikasi.</div>
 <h2>Saldo penangguhan / belum cair (bisa diajukan kembali)</h2>
 <div class="f"><label>Ajukan ke periode<input id="rp" type="month" value="${nextYM()}"></label><button class="p" onclick="reAll()">Ajukan semua saldo</button></div>
 <div class="tw"><table><tr><th>Asal</th><th>Op</th><th>Uraian</th><th>Periode asal</th><th>Jenis</th><th class="n">Saldo</th><th>Nilai diajukan</th><th></th></tr>${sal||'<tr><td colspan="8">Tidak ada saldo.</td></tr>'}</table></div>
 <div class="sub">Ubah “Nilai diajukan” untuk mengajukan sebagian. Sisanya tetap tercatat sebagai saldo dan akumulasi sampai diajukan atau ditutup.</div>
 <h2>Daftar pengajuan</h2><div class="tw"><table><tr><th>ID</th><th>Periode</th><th>Operator</th><th>Komponen</th><th>Uraian</th><th class="n">Diajukan</th><th>Status</th><th></th></tr>${rows}</table></div>`;
}
function katC(){const o=v('co'),ck=$('ck'),cur=ck.value;
 ck.innerHTML=KAT.filter(k=>katOk(o,k)).map(k=>`<option>${k}</option>`).join('');
 if(KAT.includes(cur)&&katOk(o,cur))ck.value=cur;
 subC()}
const cand=()=>S.m.filter(m=>m.kat===v('ck')&&ap(m,v('co'))&&(m.jenis||'Bus Diesel')===v('cj'));
const uniq=a=>[...new Set(a)],NS='(tanpa sub kelompok)',NG='(tanpa grup)';
function subC(){$('cs').innerHTML=uniq(cand().map(m=>m.sub||NS)).map(x=>`<option>${esc(x)}</option>`).join('');grpC()}
function grpC(){const sb=v('cs');$('cg').innerHTML=uniq(cand().filter(m=>(m.sub||NS)===sb).map(m=>m.grup||NG)).map(x=>`<option>${esc(x)}</option>`).join('');uraC()}
function uraC(){const sb=v('cs'),gp=v('cg');
 $('cu').innerHTML=cand().filter(m=>(m.sub||NS)===sb&&(m.grup||NG)===gp).map(m=>`<option value="${esc(ukey(m))}">${esc(m.kode)} · ${esc(m.nama)}</option>`).join('')||'<option value="">(belum ada komponen di master)</option>'}
function editC(id){ed=id;draw();const c=S.c.find(x=>x.id===id),s=(i,x)=>{document.getElementById(i).value=x};
 s('co',c.op);katC();const mm=S.m.find(x=>ukey(x)===c.uraian);if(mm)s('cj',mm.jenis||'Bus Diesel');s('ck',c.kat);subC();if(mm){s('cs',mm.sub||NS);grpC();s('cg',mm.grup||NG)}uraC();
 const u=document.getElementById('cu');if(![...u.options].some(o=>o.value===c.uraian))u.add(new Option(c.uraian,c.uraian));
 s('cu',c.uraian);s('cp',c.per);s('cn',c.nilai);window.scrollTo(0,0)}
function addC(){
 const c={per:v('cp'),op:v('co'),kat:v('ck'),uraian:v('cu'),nilai:+v('cn')||0};
 if(!c.uraian||c.nilai<=0)return alert('Isi uraian dan nilai');
 if(!katOk(c.op,c.kat))return alert('PT JTT tidak mengajukan Pendapatan');
 if(ed){const o=S.c.find(x=>x.id===ed);
  if(o.parent){const mx=avail(S.c.find(x=>x.id===o.parent))+o.nilai;if(c.nilai>mx)return alert('Melebihi saldo penangguhan ('+R(mx)+')');o.per=c.per;o.nilai=c.nilai}
  else Object.assign(o,c);
  ed=null}
 else{c.id=(S.n=(S.n||0)+1);c.acc=null;S.c.push(c)}
 save();draw();
}
function delC(id){const c=S.c.find(x=>x.id===id);if(c&&c.acc!=null)return;S.c=S.c.filter(c=>c.id!==id);save();draw()}
function mkKid(p,per,nilai){S.c.push({id:(S.n=(S.n||0)+1),per,op:p.op,kat:p.kat,uraian:p.uraian,nilai,acc:null,parent:p.id})}
function reC(id){const p=S.c.find(x=>x.id===id),a=+v('s'+id),mx=avail(p);
 if(!(a>0)||a>mx)return alert('Nilai harus lebih dari 0 dan maksimal '+R(mx));
 if(!v('rp'))return alert('Pilih periode');mkKid(p,v('rp'),a);save();draw()}
function reAll(){if(!v('rp'))return alert('Pilih periode');let n=0;S.c.filter(c=>avail(c)>0).forEach(c=>{mkKid(c,v('rp'),avail(c));n++});save();draw();alert(n+' saldo diajukan ke periode '+v('rp'))}
function tutC(id){const c=S.c.find(x=>x.id===id);if(!confirm('Tutup sisa '+R(avail(c))+'? Nilai ini tidak diajukan kembali dan tetap tercatat di akumulasi tidak cair.'))return;c.tutup=(c.tutup||0)+avail(c);save();draw()}

function verif(){
 const pend=S.c.filter(c=>c.acc==null).map(c=>`<tr><td>#${c.id}</td><td>${c.op}</td><td>${esc(c.uraian)}</td><td>${c.per}</td><td class="n">${R(c.nilai)}</td>
 <td><input id="a${c.id}" type="number" min="0" max="${c.nilai}" value="${c.nilai}" size="10"></td>
 <td><select id="j${c.id}"><option>Penangguhan</option><option>Tidak dicairkan</option></select></td>
 <td><button class="p" onclick="verC(${c.id})">Simpan</button></td></tr>`).join('');
 const done=S.c.filter(c=>c.acc!=null).map(c=>`<tr><td>#${c.id}</td><td>${c.op}</td><td>${esc(c.uraian)}</td><td class="n">${R(c.nilai)}</td><td class="n">${R(c.acc)}</td><td>${sel_(c)>0?c.jenis:'Disetujui penuh'}</td><td class="n">${R(reN(c))}</td><td class="n e">${R(sisa(c))}</td><td>${kids(c).length?'':`<button class="x" onclick="undoV(${c.id})">batalkan</button>`}</td></tr>`).join('');
 return `<h2>Menunggu hasil verifikasi Dishub</h2><div class="tw"><table><tr><th>ID</th><th>Op</th><th>Uraian</th><th>Periode</th><th class="n">Diajukan</th><th>ACC Dishub</th><th>Jenis selisih</th><th></th></tr>${pend}</table></div>
 <div class="sub">Selisih = diajukan − ACC. Selisih otomatis menjadi saldo di tab Pengajuan, bisa diajukan kembali seluruhnya atau sebagian di bulan berikutnya.</div>
 <h2>Sudah diverifikasi</h2><div class="tw"><table><tr><th>ID</th><th>Op</th><th>Uraian</th><th class="n">Diajukan</th><th class="n">ACC</th><th>Hasil</th><th class="n">Sudah diajukan kembali</th><th class="n">Belum cair</th><th></th></tr>${done}</table></div>`;
}
function verC(id){
 const c=S.c.find(x=>x.id===id),acc=+v('a'+id);
 if(!(acc>=0&&acc<=c.nilai))return alert('ACC harus 0 sampai nilai diajukan');
 c.acc=acc;c.jenis=v('j'+id);c.tutup=0;save();draw();
}
function undoV(id){const c=S.c.find(x=>x.id===id);c.acc=null;delete c.jenis;c.tutup=0;save();draw()}

function akum(){
 const rows=S.c.filter(c=>sisa(c)>0).map(c=>`<tr><td>#${c.id}</td><td>${c.per}</td><td>${c.op}</td><td>${esc(c.uraian)}</td><td>${c.jenis}</td><td class="n">${R(sel_(c))}</td><td class="n">${R(reN(c))}</td><td class="n">${R(avail(c))}</td><td class="n">${R(c.tutup||0)}</td><td class="n e">${R(sisa(c))}</td></tr>`).join('');
 const sum=(o,j)=>S.c.filter(c=>c.op===o&&(!j||c.jenis===j)).reduce((a,c)=>a+sg(c.kat)*sisa(c),0);
 const g=o=>`<div class="k"><span>PT ${o}</span><b class="e">${R(sum(o))}</b><span>Penangguhan ${R(sum(o,'Penangguhan'))} · Tidak dicairkan ${R(sum(o,'Tidak dicairkan'))}</span></div>`;
 return `<div class="g">${g('AMI')}${g('JTT')}</div><h2>Rincian akumulasi belum cair</h2>
 <div class="tw"><table><tr><th>ID</th><th>Periode</th><th>Op</th><th>Uraian</th><th>Jenis</th><th class="n">Selisih</th><th class="n">Diajukan kembali</th><th class="n">Masih bisa diajukan</th><th class="n">Ditutup</th><th class="n">Akumulasi</th></tr>${rows}</table></div>
 <div class="sub">Contoh: penangguhan Rp 1.000.000, diajukan kembali Rp 700.000 bulan depan, sisa Rp 300.000 tetap di akumulasi (masih bisa diajukan, atau ditutup bila memang tidak diajukan).</div>`;
}


/* ---- migrasi master ke versi baru (berdasarkan BA) ---- */
function migrateMaster(){
 const old=S.m,pk={},byK={};
 old.forEach(m=>{pk[ukey({...m,jenis:m.jenis||'Bus Diesel'})]=m;(byK[m.kode]=byK[m.kode]||[]).push(m)});
 const nw=JSON.parse(JSON.stringify(MASTER)),cnt={};nw.forEach(m=>{const k=m.jenis+m.kode;cnt[k]=(cnt[k]||0)+1});
 nw.forEach(m=>{let o=pk[ukey(m)];
  if(!o&&m.jenis==='Bus Diesel'&&cnt[m.jenis+m.kode]===1&&byK[m.kode]&&byK[m.kode].length===1)o=byK[m.kode][0];
  if(o){m.harga=o.harga;m.vol=o.vol;if(!m.sat&&o.sat)m.sat=o.sat}});
 const manual=old.filter(m=>m.id>100000).map(m=>({...m,jenis:m.jenis||'Bus Diesel'}));
 const hit=new Set(nw.map(ukey));
 S.c.forEach(c=>{if(hit.has(c.uraian))return;const p=c.uraian.split(' ')[0],cs=nw.filter(m=>m.kode===p&&m.jenis==='Bus Diesel');if(cs.length===1)c.uraian=ukey(cs[0])});
 S.m=nw.concat(manual);S.mv=CFG.masterVersion;S.f='';save()}

/* ================= Fitur tambahan ================= */
let BK=null,BAS={per:'',op:''};
const BLN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const plab=p=>{const a=p.split('-');return BLN[+a[1]-1]+' '+a[0]};
const OPN={AMI:'PT Anindya Mitra Internasional (PT AMI)',JTT:'PT Jogja Tugu Trans (PT JTT)'};

/* --- Ekspor Excel --- */
function xl(file,sheets){const wb=XLSX.utils.book_new();
 sheets.forEach(s=>XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(s[1].length?s[1]:[{Info:'Tidak ada data'}]),s[0]));
 XLSX.writeFile(wb,file+'.xlsx')}
function exp(t){
 if(typeof XLSX==='undefined')return alert('Library Excel belum termuat (butuh koneksi internet).');
 const d=new Date().toISOString().slice(0,10);
 const cl=c=>({ID:c.id,Periode:c.per,Operator:c.op,Komponen:c.kat,Uraian:c.uraian,Diajukan:c.nilai,ACC:c.acc==null?'':c.acc,Selisih:c.acc==null?'':sel_(c),Jenis:(c.acc==null||!sel_(c))?'':c.jenis,'Diajukan kembali':reN(c),Ditutup:c.tutup||0,Akumulasi:sisa(c),'Asal pengajuan':c.parent?'#'+c.parent:''});
 if(t==='rka')xl('RKA-2027-'+d,['AMI','JTT'].map(o=>['RKA '+o,rkaRows(o).map(r=>({Jenis:r.jenis||'',Kode:r.kode,Kelompok:r.kel||'','Sub kelompok':r.sub||'','Grup akun':r.grup||'',Uraian:r.nama,Satuan:r.sat,'Vol 2027':r.vol27,'Harga 2027':r.h27,Jumlah:r.tot,Margin:r.mar,Total:r.tot+r.mar}))]));
 else if(t==='master')xl('Master-Data-'+d,[['Master',S.m.map(m=>({Jenis:m.jenis||'',Kode:m.kode,Kategori:m.kat,Kelompok:m.kel||'','Sub kelompok':m.sub||'','Grup akun':m.grup||'',Uraian:m.nama,Satuan:m.sat,Operator:m.op==='BOTH'?'AMI & JTT':m.op,Margin:m.margin?'ya':'tidak','Status SK':m.sk,Harga:m.harga,Volume:m.vol}))]]);
 else if(t==='lap'){const D=repData();xl('Laporan-'+d,[['Laporan',D.rows.map(r=>{const o={Uraian:'   '.repeat(r.d)+r.lab};D.cols.forEach(c=>o[c.lab]=Math.round(c.ix.reduce((s,i)=>s+r.v[i],0)));o.Total=Math.round(r.v.reduce((a,b)=>a+b,0));return o})]])}
 else if(t==='akum')xl('Akumulasi-'+d,[['Akumulasi',S.c.filter(c=>sisa(c)>0).map(cl)]]);
 else xl('Pengajuan-'+d,[['Pengajuan',S.c.map(cl)]]);
}

/* --- Input pengajuan massal --- */
function bulkHtml(){
 const head=`<div class="pn"><h3>Input massal per periode</h3><div class="f"><label>Periode<input id="bp" type="month" value="${BK?BK.per:nowYM()}"></label><label>Operator<select id="bo"><option value="AMI" ${BK&&BK.op==='AMI'?'selected':''}>PT AMI</option><option value="JTT" ${BK&&BK.op==='JTT'?'selected':''}>PT JTT</option></select></label><button class="p" onclick="bulkOpen()">Buka lembar isian</button></div><div class="sub">Isi nilai untuk semua komponen sekaligus dalam satu periode. Kolom yang dikosongkan atau 0 dilewati.</div>`;
 if(!BK)return head+'</div>';
 const rk=Object.fromEntries(rkaRows(BK.op).map(r=>[r.id,(r.tot+r.mar)/12]));LG='';
 const rows=S.m.filter(m=>ap(m,BK.op)).map(m=>gh(m)+`<tr><td>${esc(m.kode)}</td><td>${esc(m.nama)}</td><td>${esc(m.sat)}</td><td class="n">${R(rk[m.id]||0)}</td><td><input id="bk${m.id}" type="number" min="0" size="12"></td></tr>`).join('');
 return head+`<div class="tw" style="max-height:420px;overflow:auto"><table><tr><th>Kode</th><th>Uraian</th><th>Satuan</th><th class="n">Acuan RKA / bulan</th><th>Nilai diajukan</th></tr>${rows}</table></div>
 <div class="f" style="margin-top:12px"><button class="p" onclick="bulkSave()">Simpan semua pengajuan · PT ${BK.op} · ${plab(BK.per)}</button><button class="x" onclick="BK=null;draw()">batal</button></div></div>`;
}
function bulkOpen(){if(!v('bp'))return alert('Pilih periode');BK={per:v('bp'),op:v('bo')};draw()}
function bulkSave(){
 const out=[];S.m.filter(m=>ap(m,BK.op)).forEach(m=>{const x=$('bk'+m.id),n=x?+x.value:0;if(n>0)out.push([m,n])});
 if(!out.length)return alert('Belum ada nilai yang diisi');
 const dup=out.filter(o=>S.c.some(c=>c.per===BK.per&&c.op===BK.op&&!c.parent&&c.uraian===ukey(o[0]))).length;
 if(dup&&!confirm(dup+' komponen sudah punya pengajuan di periode ini. Tetap tambahkan?'))return;
 out.forEach(o=>S.c.push({id:(S.n=(S.n||0)+1),per:BK.per,op:BK.op,kat:o[0].kat,uraian:ukey(o[0]),nilai:o[1],acc:null}));
 const k=out.length;BK=null;save();draw();alert(k+' pengajuan ditambahkan')}

/* --- Cetak BA Verifikasi --- */
function baView(){
 const pers=[...new Set(S.c.map(c=>c.per))].sort().reverse();
 if(!pers.includes(BAS.per))BAS.per=pers[0]||'';
 if(!BAS.op)BAS.op=(S.c.find(c=>c.per===BAS.per)||{op:'AMI'}).op;
 const cs=S.c.filter(c=>c.per===BAS.per&&c.op===BAS.op);
 const bar=`<div class="f no-print"><label>Periode<select class="ok" onchange="BAS.per=this.value;draw()">${pers.map(p=>`<option value="${p}" ${p===BAS.per?'selected':''}>${plab(p)}</option>`).join('')||'<option>(belum ada pengajuan)</option>'}</select></label><label>Operator<select class="ok" onchange="BAS.op=this.value;draw()">${['AMI','JTT'].map(o=>`<option value="${o}" ${o===BAS.op?'selected':''}>PT ${o}</option>`).join('')}</select></label><button class="p ok" onclick="window.print()">Cetak / Simpan PDF</button></div>`;
 if(!cs.length)return bar+'<div class="note">Tidak ada pengajuan untuk periode dan operator ini.</div>';
 let body='',ta=0,tc=0,ts=0;
 KAT.filter(k=>katOk(BAS.op,k)).forEach(k=>{const a=cs.filter(c=>c.kat===k);if(!a.length)return;
  body+=`<tr class="t"><td colspan="6">${k}</td></tr>`+a.map((c,i)=>`<tr><td>${i+1}</td><td>${esc(c.uraian)}${c.parent?' <i>(pengajuan ulang)</i>':''}</td><td class="n">${R(c.nilai)}</td><td class="n">${c.acc==null?'-':R(c.acc)}</td><td class="n">${c.acc==null?'-':R(sel_(c))}</td><td>${c.acc==null?'Belum diverifikasi':sel_(c)>0?c.jenis:'Disetujui'}</td></tr>`).join('');
  const sa=a.reduce((s,c)=>s+c.nilai,0),sc=a.reduce((s,c)=>s+(c.acc||0),0),ss=a.reduce((s,c)=>s+(c.acc==null?0:sel_(c)),0);
  body+=`<tr class="t2"><td></td><td>Jumlah ${k}</td><td class="n">${R(sa)}</td><td class="n">${R(sc)}</td><td class="n">${R(ss)}</td><td></td></tr>`;
  ta+=sg(k)*sa;tc+=sg(k)*sc;ts+=sg(k)*ss});
 body+=`<tr class="t"><td></td><td>Subsidi netto</td><td class="n">${R(ta)}</td><td class="n">${R(tc)}</td><td class="n">${R(ts)}</td><td></td></tr>`;
 const tgl=new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
 return bar+`<div class="doc"><div class="dc"><b>BERITA ACARA VERIFIKASI</b><br>Subsidi Angkutan Perkotaan Trans Jogja<br>Periode ${plab(BAS.per)}</div>
 <p>Operator: <b>${OPN[BAS.op]}</b></p><div class="tw"><table><tr><th>No</th><th>Uraian</th><th class="n">Diajukan</th><th class="n">Disetujui</th><th class="n">Selisih</th><th>Keterangan</th></tr>${body}</table></div>
 <p class="sub">Yogyakarta, ${tgl}</p><div class="sig"><div>Dinas Perhubungan DIY<br><br><br><br>(................................)</div><div>${OPN[BAS.op]}<br><br><br><br>(................................)</div></div></div>`;
}

/* --- Pengaturan: cadangan data --- */
function setView(){
 const kb=(JSON.stringify(S).length/1024).toFixed(1);
 return `<div class="g"><div class="k"><span class="kl">Komponen master</span><b>${S.m.length}</b></div><div class="k"><span class="kl">Pengajuan tercatat</span><b>${S.c.length}</b></div><div class="k"><span class="kl">Ukuran data</span><b>${kb} KB</b></div></div>
 <div class="pn"><h3>Cadangan data</h3><p class="sub">Data tersimpan di browser ini. Unduh cadangan secara berkala, dan pulihkan di perangkat lain bila perlu.</p><div class="f"><button class="p" onclick="bak()">Unduh cadangan (JSON)</button><button class="p" onclick="cpy()">Salin JSON</button><label>Pulihkan dari cadangan<input type="file" accept=".json" onchange="rst(this)"></label></div></div>
 <div class="pn"><h3>Reset</h3><p class="sub">Menghapus seluruh pengajuan dan mengembalikan master ke data awal. Unduh cadangan lebih dulu.</p><button class="x" onclick="rset()">Reset data</button></div>`}
function bak(){const b=new Blob([JSON.stringify(S,null,1)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='backup-erp-transjogja-'+new Date().toISOString().slice(0,10)+'.json';a.click()}
function cpy(){try{navigator.clipboard.writeText(JSON.stringify(S)).then(()=>alert('JSON tersalin')).catch(()=>alert('Browser menolak akses clipboard. Gunakan Unduh cadangan.'))}catch(e){alert('Clipboard tidak tersedia. Gunakan Unduh cadangan.')}}
function rst(el){const f=el.files[0];if(!f)return;const r=new FileReader();
 r.onload=e=>{try{const d=JSON.parse(e.target.result);if(!d.m||!d.c||!d.p)throw 0;if(!confirm('Ganti seluruh data dengan cadangan ini?'))return;S=d;S.f=S.f||'';save();draw();alert('Data dipulihkan')}catch(x){alert('File cadangan tidak valid')}};r.readAsText(f)}
function rset(){if(confirm('Hapus SEMUA pengajuan dan kembalikan master ke data awal di browser ini?')){S=seed();S.f='';save();draw()}}


/* ================= Laporan ================= */
let REP=null;
const MON=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const GR={bln:()=>MON.map((m,i)=>({lab:m,ix:[i]})),tw:()=>[0,1,2,3].map(q=>({lab:'TW'+(q+1),ix:[q*3,q*3+1,q*3+2]})),sem:()=>[0,1].map(s=>({lab:'Semester '+(s+1),ix:[0,1,2,3,4,5].map(x=>x+s*6)})),thn:()=>[{lab:'Tahunan',ix:[0,1,2,3,4,5,6,7,8,9,10,11]}]};
const fm=n=>Math.abs(n)<0.5?'–':Math.round(n).toLocaleString('id-ID');
const sum12=a=>a.reduce((x,y)=>x+y,0);
function repInit(){if(REP)return;REP={basis:S.c.length?'aju':'rka',op:'ALL',gran:'bln',yr:S.c.length?+S.c[S.c.length-1].per.slice(0,4):2027,depth:1,scope:''}}
function repData(){
 repInit();const Q=REP,idx={},mp={};S.m.forEach((m,i)=>{idx[m.id]=i;mp[ukey(m)]=m});
 const ops=Q.op==='ALL'?['AMI','JTT']:[Q.op],ent=[];
 const inS=m=>!Q.scope||fk(m)===Q.scope||fk(m).startsWith(Q.scope+'|');
 if(Q.basis==='rka'){if(+Q.yr===2027)ops.forEach(o=>rkaRows(o).forEach(r=>{if(inS(r))ent.push({m:r,v:Array(12).fill(r.tot/12),g:Array(12).fill(r.mar/12)})}))}
 else S.c.forEach(c=>{if(!ops.includes(c.op)||+c.per.slice(0,4)!==+Q.yr)return;
  const m=mp[c.uraian]||{id:-1,kat:c.kat,sub:'',grup:'',kel:c.kat,utama:'',kode:'',nama:c.uraian,margin:false};
  if(!inS(m))return;
  const a=Q.basis==='aju'?c.nilai:Q.basis==='acc'?(c.acc||0):sisa(c);if(!a)return;
  const v=Array(12).fill(0);v[+c.per.slice(5,7)-1]=a;
  ent.push({m,v,g:v.map(x=>m.margin?x*S.p.mg/100:0)})});
 ent.sort((a,b)=>(idx[a.m.id]??1e9)-(idx[b.m.id]??1e9));
 const pth=m=>{const a=[m.kat];if(m.sub&&m.sub.replace(/^\d+\.\s*/,'')!==m.kat)a.push(m.sub);if(m.grup)a.push(m.grup);a.push((m.kode?m.kode+' ':'')+m.nama);return a};
 const nodes=[],seen={},mar=Array(12).fill(0),dp=+Q.depth;
 ent.forEach(e=>{const p=pth(e.m);
  for(let l=0;l<Math.min(p.length,dp);l++){const key=p.slice(0,l+1).join('›');let n=seen[key];
   if(!n){n=seen[key]={lab:p[l],d:l,v:Array(12).fill(0),kat:e.m.kat};nodes.push(n)}e.v.forEach((x,i)=>n.v[i]+=x)}
  e.g.forEach((x,i)=>mar[i]+=x)});
 const nk=k=>seen[k]?seen[k].v:Array(12).fill(0);
 const P=nk('Biaya Pokok'),Dk=nk('Biaya Pendukung'),I=nk('Pendapatan'),net=P.map((x,i)=>x+Dk[i]+mar[i]-I[i]);
 const rows=[];
 KAT.forEach(k=>{nodes.filter(n=>n.kat===k).forEach(n=>rows.push({lab:n.lab,d:n.d,v:n.v,cls:['t','t2','rr','r3'][Math.min(n.d,3)]}));
  if(k==='Biaya Pendukung')rows.push({lab:'Keuntungan (margin '+S.p.mg+'%)',d:0,v:mar,cls:'t'})});
 rows.push({lab:'Subsidi netto',d:0,v:net,cls:'t'});
 return{cols:GR[Q.gran](),rows,net,kpi:{P:sum12(P),D:sum12(Dk),M:sum12(mar),I:sum12(I),N:sum12(net)}};
}
function lapView(){
 repInit();const D=repData(),Q=REP;TN=treeNodes();
 const yrs=[...new Set([2026,2027,...S.c.map(c=>+c.per.slice(0,4))])].sort();
 const so=(lab,key,opts)=>`<label>${lab}<select class="ok" onchange="REP.${key}=(this.value!==''&&!isNaN(this.value))?+this.value:this.value;draw()">${opts.map(o=>`<option value="${esc(o[0])}" ${String(o[0])===String(Q[key])?'selected':''}>${esc(o[1])}</option>`).join('')}</select></label>`;
 const ctl=`<div class="f no-print">${so('Data','basis',[['rka','RKA 2027 (anggaran)'],['aju','Diajukan'],['acc','Disetujui Dishub'],['sisa','Belum cair (akumulasi)']])}${so('Operator','op',[['ALL','PT AMI + PT JTT'],['AMI','PT AMI'],['JTT','PT JTT']])}${so('Periode','gran',[['bln','Bulanan'],['tw','Triwulan'],['sem','Semester'],['thn','Tahunan']])}${so('Tahun','yr',yrs.map(y=>[y,y]))}${so('Detail','depth',[[1,'Ringkas (kategori)'],[2,'Sub kelompok'],[3,'Grup akun'],[4,'Per komponen']])}${so('Cakupan','scope',[['','Semua komponen'],...TN.map(n=>[n.key,'\u00a0\u00a0'.repeat(n.d)+n.lab+' ('+n.n+')'])])}</div>`;
 const k=D.kpi,card=(l,b,s)=>`<div class="k"><span class="kl">${l}</span><b>${R(b)}</b><span class="ks">${s}</span></div>`;
 const cs=D.cols,nv=cs.map(c=>c.ix.reduce((s,i)=>s+D.net[i],0)),mx=Math.max(1,...nv.map(Math.abs));
 const chart=cs.map((c,i)=>`<div class="cc" title="${c.lab}: ${R(nv[i])}"><div class="bw"><i class="b1" style="height:${Math.max(0,nv[i])/mx*100}%"></i></div><span>${c.lab.replace('Semester ','S')}</span></div>`).join('');
 const head=`<tr><th>Uraian (rupiah)</th>${cs.map(c=>`<th class="n">${c.lab}</th>`).join('')}<th class="n">Total</th></tr>`;
 const body=D.rows.map(r=>`<tr class="${r.cls}"><td class="rp" style="padding-left:${14+r.d*16}px">${esc(r.lab)}</td>${cs.map(c=>`<td class="n">${fm(c.ix.reduce((s,i)=>s+r.v[i],0))}</td>`).join('')}<td class="n"><b>${fm(sum12(r.v))}</b></td></tr>`).join('');
 const warn=Q.basis==='rka'&&+Q.yr!==2027?'<div class="note">RKA hanya tersedia untuk tahun 2027.</div>':'';
 return ctl+warn+`<div class="g">${card('Biaya Pokok',k.P,'total tahun '+Q.yr)}${card('Biaya Pendukung',k.D,'total tahun '+Q.yr)}${card('Keuntungan '+S.p.mg+'%',k.M,'dari komponen kena margin')}${card('Pendapatan',k.I,'PT AMI')}${card('Subsidi netto',k.N,'Pokok + Pendukung + Keuntungan − Pendapatan')}</div>
 <div class="pn"><h3>Subsidi netto per periode</h3><div class="ch">${chart}</div></div>
 <div class="tw"><table class="rt">${head}${body}</table></div>
 <div class="sub">Keuntungan dihitung dari komponen bertanda kena margin (${S.p.mg}%). Pada data pengajuan, nilai tiap pengajuan dicatat pada bulan periodenya. Pengajuan ulang dihitung sebagai pengajuan baru di periodenya.</div>`;
}

async function loadData(){
 if(window.INLINE){CFG=INLINE.config;MASTER=INLINE.master;return}
 try{const [c,m]=await Promise.all([fetch('data/config.json').then(r=>r.json()),fetch('data/master.json').then(r=>r.json())]);CFG=c;MASTER=m}
 catch(e){document.body.innerHTML='<p style="padding:40px;font-family:sans-serif">Gagal memuat data/*.json. Jalankan lewat web server (mis. <code>npx serve</code> atau deploy ke Vercel), bukan dengan membuka file langsung.</p>';throw e}
}
async function init(){
 await loadData();TABS=CFG.tabs;
 try{S=JSON.parse(localStorage.getItem('erpTJ2'))}catch(e){}
 S=S||seed();S.p=Object.assign({},CFG.params,S.p);S.f=S.f||'';
 if((S.mv||1)<CFG.masterVersion)migrateMaster();
 S.m.forEach(m=>{if(!m.sub&&!m.grup&&0){const s=MASTER.find(x=>x.kode===m.kode);if(s)Object.assign(m,{utama:s.utama,kel:s.kel,sub:s.sub,grup:s.grup})}});
 let u0,r0;try{u0=sessionStorage.getItem('tjU');r0=sessionStorage.getItem('tjR')}catch(e){}
 if(u0)enter(u0,r0);
}
['upM','addM','delM','impM','editC','addC','delC','reC','reAll','tutC','verC','undoV','bulkOpen','bulkSave','bak','cpy','rst','rset'].forEach(n=>{const f=window[n];window[n]=function(){if(GUEST){alert('Mode tamu: hanya dapat melihat data.');return}return f.apply(this,arguments)}});
init();
