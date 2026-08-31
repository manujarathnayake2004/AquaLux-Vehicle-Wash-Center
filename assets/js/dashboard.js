function canvasSetup(canvas){const ratio=window.devicePixelRatio||1,w=canvas.clientWidth||600,h=Number(canvas.getAttribute('height'))||220;canvas.width=w*ratio;canvas.height=h*ratio;canvas.style.height=h+'px';const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);return{ctx,w,h}}
function drawLineChart(id,items){const c=document.getElementById(id);if(!c)return;const{ctx,w,h}=canvasSetup(c),pad={l:34,r:18,t:20,b:32},vals=items.map(x=>Number(x.bookings)||0),max=Math.max(4,...vals)+1;ctx.clearRect(0,0,w,h);ctx.strokeStyle='rgba(65,116,125,.14)';ctx.lineWidth=1;for(let i=0;i<4;i++){const y=pad.t+(h-pad.t-pad.b)*i/3;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke()}const pts=vals.map((v,i)=>({x:pad.l+(w-pad.l-pad.r)*(i/Math.max(1,vals.length-1)),y:h-pad.b-(h-pad.t-pad.b)*v/max}));const grad=ctx.createLinearGradient(0,pad.t,0,h-pad.b);grad.addColorStop(0,'rgba(34,181,190,.32)');grad.addColorStop(1,'rgba(34,181,190,0)');ctx.beginPath();ctx.moveTo(pts[0].x,h-pad.b);pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.lineTo(pts[pts.length-1].x,h-pad.b);ctx.closePath();ctx.fillStyle=grad;ctx.fill();ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle='#169fa8';ctx.lineWidth=3;ctx.stroke();pts.forEach((p,i)=>{ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#169fa8';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#648084';ctx.font='11px Arial';ctx.textAlign='center';ctx.fillText(items[i].label,p.x,h-10)})}
function drawBarChart(id,items){const c=document.getElementById(id);if(!c)return;const{ctx,w,h}=canvasSetup(c),pad=30,vals=items.map(x=>Number(x.bookings)||0),max=Math.max(4,...vals)+1,gap=12,bw=(w-pad*2-gap*(vals.length-1))/vals.length;ctx.clearRect(0,0,w,h);vals.forEach((v,i)=>{const bh=(h-58)*v/max,x=pad+i*(bw+gap),y=h-28-bh,g=ctx.createLinearGradient(0,y,0,h-28);g.addColorStop(0,i===vals.length-2?'#9369ed':'#20b9bf');g.addColorStop(1,i===vals.length-2?'#c9b6fb':'#b8efdf');ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x,y,bw,bh||5,8);ctx.fill();ctx.fillStyle='#648084';ctx.font='11px Arial';ctx.textAlign='center';ctx.fillText(items[i].label,x+bw/2,h-9)})}
function drawDonut(id,completed,pending,cancelled=0){const c=document.getElementById(id);if(!c)return;const{ctx,w,h}=canvasSetup(c),total=Math.max(1,completed+pending+cancelled),cx=w/2,cy=h/2-5,r=Math.min(w,h)*.31,colors=['#19b7aa','#ffd166','#ff7c8b'],values=[completed,pending,cancelled];let start=-Math.PI/2;ctx.clearRect(0,0,w,h);values.forEach((v,i)=>{const angle=Math.PI*2*v/total;ctx.beginPath();ctx.arc(cx,cy,r,start,start+angle);ctx.strokeStyle=colors[i];ctx.lineWidth=18;ctx.lineCap='round';ctx.stroke();start+=angle});ctx.fillStyle='#173a42';ctx.textAlign='center';ctx.font='700 28px Arial';ctx.fillText(Math.round(completed/total*100)+'%',cx,cy+4);ctx.fillStyle='#6a8387';ctx.font='11px Arial';ctx.fillText('completed',cx,cy+23)}
function renderRecent(items){const box=document.getElementById('recentBookingList');if(!box)return;const admin=location.pathname.includes('/admin/');box.innerHTML=items.length?items.map(r=>{const state=String(r.status).toLowerCase(),label=state==='completed'?'Receipt':state==='cancelled'?'Rebook':'Update',href=admin?`booking-details.html?id=${r.id}`:state==='completed'?`receipt.html?bookingId=${r.id}`:state==='cancelled'?`create-booking.html?rebook=${r.id}`:`update-booking.html?id=${r.id}`;return `<div><b>BK${r.id}</b><span><strong>${escapeHtml(r.customer_name)}</strong><small>${escapeHtml(r.vehicle_no)} · ${escapeHtml(r.vehicle_type)}</small></span><span class="booking-package">${escapeHtml(r.package_name)}</span><time><small>${escapeHtml(r.booking_date)}</small>${escapeHtml(r.booking_time)}</time><em class="${state}">${escapeHtml(r.status)}</em><a class="booking-action" href="${href}">${label}</a></div>`}).join(''):'<p>No booking records available.</p>'}
async function loadDashboardStats(){try{const r=await fetch('/api/dashboard',{credentials:'include'}),d=await r.json();if(!r.ok)throw Error(d.error||'Dashboard unavailable');const map={totalBookings:d.totalBookings,todayIncome:formatLKR(d.todayIncome),pendingBookings:d.pending,completedBookings:d.completed,customerCount:d.customers,vehicleCount:d.vehicles};Object.entries(map).forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.textContent=v});drawLineChart('adminTrendChart',d.trend);drawLineChart('staffTrendChart',d.trend);drawBarChart('staffBarChart',d.trend);drawDonut('adminStatusChart',d.completed,d.pending,d.cancelled);drawDonut('staffStatusChart',d.completed,d.pending);renderRecent(d.recentBookings||[])}catch(e){console.error('Dashboard data unavailable',e)}}
function customerSlotTime(row){
 const value=`${row.booking_date||''}T${String(row.booking_time||'00:00').slice(0,5)}:00`;
 const parsed=new Date(value);
 return Number.isNaN(parsed.getTime())?0:parsed.getTime();
}
function formatCustomerVisit(row){
 if(!row)return 'No upcoming visit yet';
 const dateValue=new Date(`${row.booking_date}T00:00:00`);
 const dateLabel=Number.isNaN(dateValue.getTime())?row.booking_date:dateValue.toLocaleDateString('en-LK',{month:'short',day:'numeric'});
 return `${dateLabel} · ${String(row.booking_time||'').slice(0,5)}`;
}
function renderCustomerRecent(items){
 const box=document.getElementById('customerRecentBookingList');
 if(!box)return;
 box.innerHTML=items.length?items.slice(0,6).map(row=>{
   const state=String(row.status||'Pending').toLowerCase();
   return `<div><b>BK${row.id}</b><span><strong>${escapeHtml(row.package_name)}</strong><small>${escapeHtml(row.vehicle_no)} · ${escapeHtml(row.vehicle_type)}</small></span><time><small>${escapeHtml(row.booking_date)}</small>${escapeHtml(row.booking_time)}</time><em class="${state}">${escapeHtml(row.status)}</em><a class="booking-action" href="my-bookings.html">View</a></div>`;
 }).join(''):'<p>You do not have any bookings yet. <a href="request-booking.html">Request your first booking →</a></p>';
}
async function loadCustomerDashboard(){
 try{
   const [bookings,packages]=await Promise.all([apiRows('/api/bookings'),apiRows('/api/packages')]);
   const now=Date.now();
   const pending=bookings.filter(row=>String(row.status).toLowerCase()==='pending').length;
   const completed=bookings.filter(row=>String(row.status).toLowerCase()==='completed').length;
   const upcoming=bookings.filter(row=>String(row.status).toLowerCase()!=='cancelled'&&customerSlotTime(row)>=now).sort((a,b)=>customerSlotTime(a)-customerSlotTime(b));
   const values={customerUpcoming:upcoming.length,customerPending:pending,customerCompleted:completed,customerPackageCount:packages.filter(row=>Number(row.active)!==0).length};
   Object.entries(values).forEach(([id,value])=>{const element=document.getElementById(id);if(element)element.textContent=value});
   const next=document.getElementById('customerNextVisit');if(next)next.textContent=formatCustomerVisit(upcoming[0]);
   renderCustomerRecent(bookings);
 }catch(error){
   console.error('Customer dashboard data unavailable',error);
   const box=document.getElementById('customerRecentBookingList');if(box)box.innerHTML='<p>Unable to load your booking records right now.</p>';
 }
}
document.addEventListener('DOMContentLoaded',()=>{
 if(location.pathname.includes('/pages/customer/'))loadCustomerDashboard();
 else loadDashboardStats();
});
