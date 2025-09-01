const express=require("express");const app=express();app.get("/",(req,res)=>res.send("TEST"));app.listen(5000,()=>console.log("Port 5000 OK"));
