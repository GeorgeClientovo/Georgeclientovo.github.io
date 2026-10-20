// Check that the clip is an MP4, with diagnostic exit codes for CI.
const source = "https://assets.mixkit.co/videos/preview/mixkit-people-working-in-the-office-42617-large.mp4";
try {
 const response = await fetch(source, {headers: {Range:"bytes=0-1023"},signal:AbortSignal.timeout(25000)});
 if (!response.ok) { console.error("Media HTTP",response.status); process.exit(response.status===404?44:response.status===403?43:45); }
 const reader = response.body.getReader();
 let first=Buffer.alloc(0);
 while(first.length<32){const part=await reader.read();if(part.done)break;first=Buffer.concat([first,Buffer.from(part.value)]);}
 await reader.cancel();
 if(!first.includes(Buffer.from("ftyp"))){console.error("Not an MP4");process.exit(46);}
 console.log("Hero MP4 verified");
} catch(error) {console.error(error.message);process.exit(47);}
