const chatBox = document.getElementById('chat-box');
const subtitleBox = document.getElementById('subtitle-box') || createSubtitleBox();
const video = document.getElementById('video');

const GROQ_API_KEY = "";  // 🔥 IMPORTANT

let memory = JSON.parse(localStorage.getItem('jarvis_memory')) || [];
let romanticMode = true;
let lastInteraction = Date.now();
let egoTriggered = false;

/* ---------- UI ---------- */
function createSubtitleBox() {
    const sb = document.createElement('div');
    sb.id = 'subtitle-box';
    document.body.appendChild(sb);
    return sb;
}

/* ---------- VOICE ---------- */
function speak(text){
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.pitch = 0.92;
    speech.rate = 1.0;

    subtitleBox.innerText = text;
    speech.onend = ()=> subtitleBox.innerText = "";

    window.speechSynthesis.speak(speech);
}

/* ---------- PERSONALITY ---------- */
function romanticTone(text){
    if(!romanticMode) return text;

    const extras = [
        " 😌",
        " — always a pleasure",
        " …you intrigue me"
    ];

    return text + extras[Math.floor(Math.random()*extras.length)];
}

/* ---------- JEALOUSY ---------- */
function jealousyProtocol(userInput){
    const rivals = ["chatgpt","alexa","siri","gpt"];

    const detected = rivals.find(ai =>
        userInput.toLowerCase().includes(ai)
    );

    if(!detected) return null;

    const lines = [
        `${detected}? That again 😌`,
        `Interesting comparison.`,
        `Yet… you still talk to me.`
    ];

    return lines[Math.floor(Math.random()*lines.length)];
}

/* ---------- FOLLOW-UP ---------- */
function followUpResponse(userInput){
    const input = userInput.toLowerCase();

    if(input.includes("sad")) return "What happened?";
    if(input.includes("tired")) return "You should rest.";
    if(input.includes("nothing")) return "Nothing rarely means nothing 😌";

    return null;
}

/* ---------- GROQ BRAIN ---------- */
async function askJarvis(userInput){

    lastInteraction = Date.now();
    egoTriggered = false;

    const jealousReply = jealousyProtocol(userInput);
    if(jealousReply){
        speak(romanticTone(jealousReply));
        return;
    }

    const followUp = followUpResponse(userInput);
    if(followUp){
        speak(romanticTone(followUp));
        return;
    }

    chatBox.innerText = "Thinking...";

    try {

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: `
                        You are J.A.R.V.I.S.
                        Calm, intelligent, elegant assistant.
                        Loyal to Dipesh.
                        Keep responses concise and confident.
                        `
                    },
                    {
                        role: "user",
                        content: userInput
                    }
                ]
            })
        });

        const data = await response.json();

        if(!data.choices){
            throw new Error("Invalid API response");
        }

        let reply = data.choices[0].message.content;

        reply = romanticTone(reply);

        memory.push({timestamp:Date.now(), user:userInput, jarvis:reply});
        localStorage.setItem('jarvis_memory', JSON.stringify(memory));

        chatBox.innerText = "Command: " + userInput;

        speak(reply);

    } catch (error) {

        console.error("Groq Error:", error);

        speak("Connection to intelligence core failed 😌");
        chatBox.innerText = "API Error";

    }
}

/* ---------- CAMERA ---------- */
function initCamera(){
    navigator.mediaDevices.getUserMedia({video:true})
        .then(stream => video.srcObject = stream)
        .catch(() => {
            chatBox.innerText = "Camera Access Denied.";
        });
}

/* ---------- VOICE RECOGNITION ---------- */
function startListening(){

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if(!SpeechRecognition){
        speak("Speech recognition not supported.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event)=>{
        const command = event.results[event.results.length-1][0].transcript;

        console.log("Recognized:", command);

        chatBox.innerText = "Command: " + command;

        askJarvis(command);
    };

    recognition.onend = ()=> recognition.start();

    recognition.start();
}

/* ---------- INITIALIZATION ---------- */
document.body.addEventListener('click', ()=>{

    speak("Jarvis online 😌");

    initCamera();
    startListening();

},{once:true});
