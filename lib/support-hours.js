// Live-agent support hours, in UK time (Europe/London handles GMT/BST automatically).
// Change OPEN_HOUR / CLOSE_HOUR here and in live-chat.js (same numbers) to change the hours.
export const OPEN_HOUR=8, CLOSE_HOUR=22;      // 8am to 10pm, every day
export const HOURS_TEXT='8am to 10pm UK time, every day';
export function ukHour(now=new Date()){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(now);
 const h=Number(parts.find(p=>p.type==='hour').value)%24,m=Number(parts.find(p=>p.type==='minute').value);
 return h+m/60;
}
export const teamOnline=(now=new Date())=>{const h=ukHour(now);return h>=OPEN_HOUR&&h<CLOSE_HOUR};
