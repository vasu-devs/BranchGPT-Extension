(function(){const l={name:"ChatGPT",matches(t){return t.includes("chatgpt.com")},getMessages(){const t=document.querySelectorAll(".text-message-content"),o=[];return t.forEach(n=>{const s=n.closest('[data-message-author-role="user"]')!==null;o.push({role:s?"user":"assistant",content:n.textContent||""})}),o},getInputElement(){return document.querySelector("#prompt-textarea")},getSubmitButton(){return document.querySelector('[data-testid="send-button"]')},injectSidebar(t){document.body.appendChild(t)}},d=[l];function u(){const t=d.find(n=>n.matches(window.location.href));if(!t)return;console.log(`BranchGPT: Active driver ${t.name}`),new MutationObserver(()=>{document.querySelectorAll(".text-message-content").forEach((n,s)=>{var a,i;if((a=n.parentElement)!=null&&a.querySelector(".branch-gpt-fork-btn"))return;const r=document.createElement("div");r.className="branch-gpt-fork-btn",r.style.cssText=`
                margin-top: 8px;
                display: flex;
                align-items: center;
            `;const e=document.createElement("button");e.title="Fork this conversation",e.innerHTML=`
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 3V15C6 16.6569 7.34315 18 9 18H18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M18 15L21 18L18 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="6" cy="3" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
                <span style="margin-left: 6px; font-size: 13px; font-weight: 500;">Fork Branch</span>
            `,e.style.cssText=`
                display: flex;
                align-items: center;
                background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 9999px;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
                z-index: 50;
            `,e.onmouseenter=()=>{e.style.transform="translateY(-1px)",e.style.boxShadow="0 4px 6px rgba(139, 92, 246, 0.4)"},e.onmouseleave=()=>{e.style.transform="translateY(0)",e.style.boxShadow="0 2px 4px rgba(139, 92, 246, 0.3)"},e.onclick=c=>{c.stopPropagation(),chrome.runtime.sendMessage({type:"FORK_BRANCH",payload:{content:n.textContent,position:s}})},r.appendChild(e),(i=n.parentElement)==null||i.appendChild(r)})}).observe(document.body,{childList:!0,subtree:!0})}u();
})()
