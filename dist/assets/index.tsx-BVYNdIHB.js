(function(){const p={name:"ChatGPT",matches(t){return t.includes("chatgpt.com")},getMessages(){const t=document.querySelectorAll(".text-message-content"),r=[];return t.forEach(i=>{const n=i.closest('[data-message-author-role="user"]')!==null;r.push({role:n?"user":"assistant",content:i.textContent||""})}),r},getInputElement(){return document.querySelector("#prompt-textarea")},getSubmitButton(){return document.querySelector('[data-testid="send-button"]')},injectSidebar(t){document.body.appendChild(t)}},m=[p];function g(){const t=m.find(n=>n.matches(window.location.href));if(!t)return;console.log(`BranchGPT: Active driver ${t.name}`);function r(){const n=document.querySelectorAll("[data-message-author-role]");n.length,n.forEach((s,l)=>{const a=s.querySelector(".markdown")||s.querySelector(".text-message-content");if(!a||s.querySelector(".branch-gpt-fork-btn"))return;const o=document.createElement("div");o.className="branch-gpt-fork-btn",o.style.cssText=`
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
        `,e.onmouseenter=()=>{e.style.background="rgba(139, 92, 246, 0.15)",e.style.boxShadow="0 0 8px rgba(139, 92, 246, 0.2)",e.style.transform="translateY(-1px)"},e.onmouseleave=()=>{e.style.background="transparent",e.style.boxShadow="none",e.style.transform="translateY(0)"},e.onclick=d=>{var c;d.stopPropagation(),chrome.runtime.sendMessage({type:"FORK_BRANCH",payload:{content:(c=a.textContent)==null?void 0:c.slice(0,100),position:l}});const u=e.innerHTML;e.innerHTML='<span style="font-size: 12px;">✅ Forked</span>',setTimeout(()=>e.innerHTML=u,2e3)},o.appendChild(e),a.parentElement?a.parentElement.appendChild(o):s.appendChild(o)})}new MutationObserver(()=>r()).observe(document.body,{childList:!0,subtree:!0}),setInterval(r,1e3)}g();
})()
