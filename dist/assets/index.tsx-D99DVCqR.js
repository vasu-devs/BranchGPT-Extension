(function(){const k={name:"ChatGPT",matches(t){return t.includes("chatgpt.com")},getMessages(){const t=document.querySelectorAll(".text-message-content"),o=[];return t.forEach(i=>{const n=i.closest('[data-message-author-role="user"]')!==null;o.push({role:n?"user":"assistant",content:i.textContent||""})}),o},getInputElement(){return document.querySelector("#prompt-textarea")},getSubmitButton(){return document.querySelector('[data-testid="send-button"]')},injectSidebar(t){document.body.appendChild(t)}},x=[k];function w(){const t=x.find(n=>n.matches(window.location.href));if(!t)return;console.log(`BranchGPT: Active driver ${t.name}`);function o(){const n=document.querySelectorAll("[data-message-author-role]");n.length,n.forEach((s,d)=>{const a=s.querySelector(".markdown")||s.querySelector(".text-message-content");if(!a||s.querySelector(".branch-gpt-fork-btn"))return;const r=document.createElement("div");r.className="branch-gpt-fork-btn",r.style.cssText=`
            margin-top: 8px;
            display: flex;
            align-items: center;
            padding-left: 0px;
        `;const e=document.createElement("button");e.title="Fork this conversation",e.innerHTML=`
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 3V15C6 16.6569 7.34315 18 9 18H18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18 15L21 18L18 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="6" cy="3" r="3" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span style="margin-left: 6px; font-size: 12px; font-weight: 600; letter-spacing: 0.02em;">Fork</span>
        `,e.style.cssText=`
            display: flex;
            align-items: center;
            background: transparent; 
            color: #a78bfa;
            border: 1px solid rgba(139, 92, 246, 0.4);
            padding: 4px 10px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: inherit;
        `,e.onmouseenter=()=>{e.style.background="rgba(139, 92, 246, 0.15)",e.style.boxShadow="0 0 8px rgba(139, 92, 246, 0.2)",e.style.transform="translateY(-1px)"},e.onmouseleave=()=>{e.style.background="transparent",e.style.boxShadow="none",e.style.transform="translateY(0)"},e.onclick=h=>{var m;h.stopPropagation();const p=[],b=document.querySelectorAll("[data-message-author-role]");for(let l=0;l<=d;l++){const c=b[l];if(!c)continue;const y=c.getAttribute("data-message-author-role")||"unknown",u=c.querySelector(".markdown")||c.querySelector(".text-message-content"),g=(u==null?void 0:u.textContent)||"";g&&p.push({role:y,content:g})}chrome.runtime.sendMessage({type:"FORK_BRANCH",payload:{content:(m=a.textContent)==null?void 0:m.slice(0,100),fullHistory:p,position:d}});const f=e.innerHTML;e.innerHTML='<span style="font-size: 12px;">✅ Forked</span>',setTimeout(()=>e.innerHTML=f,2e3)},r.appendChild(e),a.parentElement?a.parentElement.appendChild(r):s.appendChild(r)})}new MutationObserver(()=>o()).observe(document.body,{childList:!0,subtree:!0}),setInterval(o,1e3)}w();
})()
