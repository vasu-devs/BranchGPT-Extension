(function(){const a={name:"ChatGPT",matches(e){return e.includes("chatgpt.com")},getMessages(){const e=document.querySelectorAll(".text-message-content"),r=[];return e.forEach(t=>{const o=t.closest('[data-message-author-role="user"]')!==null;r.push({role:o?"user":"assistant",content:t.textContent||""})}),r},getInputElement(){return document.querySelector("#prompt-textarea")},getSubmitButton(){return document.querySelector('[data-testid="send-button"]')},injectSidebar(e){document.body.appendChild(e)}},u=[a];function i(){const e=u.find(t=>t.matches(window.location.href));if(!e)return;console.log(`BranchGPT: Active driver ${e.name}`),new MutationObserver(()=>{document.querySelectorAll(".text-message-content").forEach((t,o)=>{var s,c;if((s=t.parentElement)!=null&&s.querySelector(".branch-gpt-fork-btn"))return;const n=document.createElement("button");n.className="branch-gpt-fork-btn",n.innerText="🌿 Fork",n.style.cssText=`
        margin-left: 10px; 
        font-size: 12px; 
        background: #8b5cf6; 
        color: white; 
        border: none; 
        padding: 2px 6px; 
        border-radius: 4px; 
        cursor: pointer;
      `,n.onclick=()=>{chrome.runtime.sendMessage({type:"FORK_BRANCH",payload:{content:t.textContent,position:o}})},(c=t.parentElement)==null||c.appendChild(n)})}).observe(document.body,{childList:!0,subtree:!0})}i();
})()
