"use strict";(()=>{var e={};e.id=356,e.ids=[356],e.modules={5142:e=>{e.exports=require("dotenv")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},5900:e=>{e.exports=require("pg")},6249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,s){return s in t?t[s]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,s)):"function"==typeof t&&"default"===s?t:void 0}}})},3063:(e,t,s)=>{s.r(t),s.d(t,{config:()=>u,default:()=>_,routeModule:()=>T});var a={};s.r(a),s.d(a,{default:()=>d});var r=s(1802),o=s(7153),n=s(6249),i=s(6760),l=s(8243);let c=!1,E=async()=>{c||(await (0,l.qZ)(),c=!0)};async function d(e,t){try{await E();let s=new i.l,a=parseInt(e.query.limit)||100,r=await s.getRecentLogs(a);t.json(r)}catch(e){console.error("Get logs error:",e),t.status(500).json({error:e.message})}}let _=(0,n.l)(a,"default"),u=(0,n.l)(a,"config"),T=new r.PagesAPIRouteModule({definition:{kind:o.x.PAGES_API,page:"/api/analytics/logs",pathname:"/api/analytics/logs",bundlePath:"",filename:""},userland:a})},7153:(e,t)=>{var s;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return s}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(s||(s={}))},1802:(e,t,s)=>{e.exports=s(145)},8243:(e,t,s)=>{s.d(t,{d_:()=>r,qZ:()=>o});var a=s(5900);s(5142).config();let r=new a.Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:!1},max:20,idleTimeoutMillis:3e4,connectionTimeoutMillis:1e4});r.on("error",e=>{console.error("⚠️  Database pool error:",e.message)});let o=async()=>{try{await r.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(500),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inference_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
        message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
        provider VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        latency_ms INTEGER,
        prompt_tokens INTEGER,
        completion_tokens INTEGER,
        total_tokens INTEGER,
        cost_estimate DECIMAL(10, 6),
        status VARCHAR(50) NOT NULL,
        error_message TEXT,
        request_preview TEXT,
        response_preview TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_inference_logs_conversation ON inference_logs(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_inference_logs_created ON inference_logs(created_at);
    `),console.log("✅ Database initialized successfully")}catch(e){throw console.error(" Database initialization failed:",e.message),console.error("  Running in degraded mode - database features disabled"),console.error("  Please check your DATABASE_URL in .env file"),e}}},6760:(e,t,s)=>{s.d(t,{E:()=>i,l:()=>l});var a=s(8243);let r=null,o=(process.env.UPSTASH_REDIS_REST_URL&&process.env.UPSTASH_REDIS_REST_TOKEN&&(r={url:process.env.UPSTASH_REDIS_REST_URL,token:process.env.UPSTASH_REDIS_REST_TOKEN,get:async e=>{try{let t=await fetch(`${r.url}/get/${e}`,{headers:{Authorization:`Bearer ${r.token}`}});return(await t.json()).result}catch(e){return console.error("Redis GET error:",e),null}},set:async(e,t,s=300)=>{try{let a=await fetch(`${r.url}/set/${e}`,{method:"POST",headers:{Authorization:`Bearer ${r.token}`,"Content-Type":"application/json"},body:JSON.stringify({value:t,ex:s})});return await a.json()}catch(e){return console.error("Redis SET error:",e),null}},del:async e=>{try{let t=await fetch(`${r.url}/del/${e}`,{headers:{Authorization:`Bearer ${r.token}`}});return await t.json()}catch(e){return console.error("Redis DEL error:",e),null}}}),r),n=async(e,t,s=300)=>{if(!o)return await t();let a=await o.get(e);if(a)try{return JSON.parse(a)}catch{return a}let r=await t();return await o.set(e,JSON.stringify(r),s),r};class i{constructor(){this.createConversation=async e=>{let t=await a.d_.query(`INSERT INTO conversations (session_id, status) 
       VALUES ($1, 'active') 
       RETURNING *`,[e]);return o&&await o.del("conversations:list"),this.mapRow(t.rows[0])},this.getConversationBySession=async e=>{let t=await a.d_.query("SELECT * FROM conversations WHERE session_id = $1",[e]);return t.rows[0]?this.mapRow(t.rows[0]):null},this.listConversations=async(e=50)=>n("conversations:list",async()=>(await a.d_.query("SELECT * FROM conversations WHERE status != 'cancelled' ORDER BY updated_at DESC LIMIT $1",[e])).rows.map(this.mapRow),60),this.getConversation=async e=>n(`conversation:${e}`,async()=>{let t=await a.d_.query("SELECT * FROM conversations WHERE id = $1",[e]);return t.rows[0]?this.mapRow(t.rows[0]):null},300),this.updateConversation=async(e,t)=>{let s=[],r=[],n=1;void 0!==t.title&&(s.push(`title = $${n++}`),r.push(t.title)),void 0!==t.status&&(s.push(`status = $${n++}`),r.push(t.status)),s.push("updated_at = NOW()"),r.push(e),await a.d_.query(`UPDATE conversations SET ${s.join(", ")} WHERE id = $${n}`,r),o&&(await o.del(`conversation:${e}`),await o.del("conversations:list"))},this.addMessage=async(e,t,s)=>{let r=await a.d_.query(`INSERT INTO messages (conversation_id, role, content) 
       VALUES ($1, $2, $3) 
       RETURNING *`,[e,t,s]);return await a.d_.query("UPDATE conversations SET updated_at = NOW() WHERE id = $1",[e]),o&&(await o.del(`messages:${e}`),await o.del(`conversation:${e}`),await o.del("conversations:list")),this.mapMessage(r.rows[0])},this.getMessages=async e=>n(`messages:${e}`,async()=>(await a.d_.query("SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",[e])).rows.map(this.mapMessage),60),this.mapRow=e=>({id:e.id,sessionId:e.session_id,title:e.title,status:e.status,createdAt:e.created_at,updatedAt:e.updated_at}),this.mapMessage=e=>({id:e.id,conversationId:e.conversation_id,role:e.role,content:e.content,createdAt:e.created_at})}}class l{constructor(){this.ingestLog=async(e,t)=>{await a.d_.query(`INSERT INTO inference_logs (
        id, conversation_id, message_id, provider, model, 
        latency_ms, prompt_tokens, completion_tokens, total_tokens,
        cost_estimate, status, error_message, request_preview, 
        response_preview, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,[e.id,e.conversationId,t||null,e.provider,e.model,e.latencyMs,e.promptTokens||null,e.completionTokens||null,e.totalTokens||null,e.costEstimate||null,e.status,e.errorMessage||null,e.requestPreview||null,e.responsePreview||null,JSON.stringify(e.metadata||{}),e.createdAt]),o&&(await o.del("analytics:dashboard"),await o.del("analytics:logs"))},this.getAnalytics=async(e,t)=>n(`analytics:${e||"all"}:${t||"all"}`,async()=>{let s=e&&t?"WHERE created_at BETWEEN $1 AND $2":"",r=e&&t?[e,t]:[],[o,n,i]=await Promise.all([a.d_.query(`
            SELECT 
              COUNT(*) as total_requests,
              AVG(latency_ms) as avg_latency,
              PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms) as p50_latency,
              PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency,
              PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) as p99_latency,
              SUM(total_tokens) as total_tokens,
              SUM(cost_estimate) as total_cost
            FROM inference_logs ${s}
          `,r),a.d_.query(`
            SELECT 
              provider, model,
              COUNT(*) as request_count,
              AVG(latency_ms) as avg_latency,
              SUM(total_tokens) as total_tokens
            FROM inference_logs ${s}
            GROUP BY provider, model
          `,r),a.d_.query(`
            SELECT 
              COUNT(CASE WHEN status = 'error' THEN 1 END)::float / NULLIF(COUNT(*)::float, 0) as error_rate
            FROM inference_logs ${s}
          `,r)]);return{overview:o.rows[0],byProvider:n.rows,errorRate:i.rows[0].error_rate||0}},300),this.getRecentLogs=async(e=100)=>n(`logs:recent:${e}`,async()=>(await a.d_.query("SELECT * FROM inference_logs ORDER BY created_at DESC LIMIT $1",[e])).rows.map(this.mapLog),60),this.mapLog=e=>({id:e.id,conversationId:e.conversation_id,messageId:e.message_id,provider:e.provider,model:e.model,latencyMs:e.latency_ms,promptTokens:e.prompt_tokens,completionTokens:e.completion_tokens,totalTokens:e.total_tokens,costEstimate:parseFloat(e.cost_estimate),status:e.status,errorMessage:e.error_message,requestPreview:e.request_preview,responsePreview:e.response_preview,metadata:e.metadata,createdAt:e.created_at})}}}};var t=require("../../../webpack-api-runtime.js");t.C(e);var s=t(t.s=3063);module.exports=s})();