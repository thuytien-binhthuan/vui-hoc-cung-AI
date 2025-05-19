const BlockType = require('../../extension-support/block-type');
const ArgumentType = require('../../extension-support/argument-type');
const TargetType = require('../../extension-support/target-type');

class Scratch3YourExtension {

    constructor (runtime) {
        // put any setup for your extension here
        // Save the runtime so it can be used later.
        this.runtime = runtime;
        this._deepgramKey = '';
    }

    /**
     * Returns the metadata about your extension.
     */
    getInfo () {
        return {
            // unique ID for your extension
            id: 'yourScratchExtension',

            // name that will be displayed in the Scratch UI
            name: 'Demo',

            // colours to use for your extension blocks
            color1: '#000099',
            color2: '#660066',

            // icons to display
            blockIconURI: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAFCAAAAACyOJm3AAAAFklEQVQYV2P4DwMMEMgAI/+DEUIMBgAEWB7i7uidhAAAAABJRU5ErkJggg==',
            menuIconURI: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAFCAAAAACyOJm3AAAAFklEQVQYV2P4DwMMEMgAI/+DEUIMBgAEWB7i7uidhAAAAABJRU5ErkJggg==',

            // your Scratch blocks
            blocks: [
                {
                    // name of the function where your block code lives
                    opcode: 'myFirstBlock',

                    // type of block - choose from:
                    //   BlockType.REPORTER - returns a value, like "direction"
                    //   BlockType.BOOLEAN - same as REPORTER but returns a true/false value
                    //   BlockType.COMMAND - a normal command block, like "move {} steps"
                    //   BlockType.HAT - starts a stack if its value changes from false to true ("edge triggered")
                    blockType: BlockType.REPORTER,

                    // label to display on the block
                    text: 'My first block [MY_NUMBER] and [MY_STRING]',

                    // true if this block should end a stack
                    terminal: false,

                    // where this block should be available for code - choose from:
                    //   TargetType.SPRITE - for code in sprites
                    //   TargetType.STAGE  - for code on the stage / backdrop
                    // remove one of these if this block doesn't apply to both
                    filter: [ TargetType.SPRITE, TargetType.STAGE ],

                    // arguments used in the block
                    arguments: {
                        MY_NUMBER: {
                            // default value before the user sets something
                            defaultValue: 123,

                            // type/shape of the parameter - choose from:
                            //     ArgumentType.ANGLE - numeric value with an angle picker
                            //     ArgumentType.BOOLEAN - true/false value
                            //     ArgumentType.COLOR - numeric value with a colour picker
                            //     ArgumentType.NUMBER - numeric value
                            //     ArgumentType.STRING - text value
                            //     ArgumentType.NOTE - midi music value with a piano picker
                            type: ArgumentType.NUMBER
                        },
                        MY_STRING: {
                            // default value before the user sets something
                            defaultValue: 'hello',

                            // type/shape of the parameter - choose from:
                            //     ArgumentType.ANGLE - numeric value with an angle picker
                            //     ArgumentType.BOOLEAN - true/false value
                            //     ArgumentType.COLOR - numeric value with a colour picker
                            //     ArgumentType.NUMBER - numeric value
                            //     ArgumentType.STRING - text value
                            //     ArgumentType.NOTE - midi music value with a piano picker
                            type: ArgumentType.STRING
                        }
                    }
                },
                {
                    opcode: 'askAI',
                    blockType: BlockType.COMMAND,
                    text: 'ask AI [QUESTION]',
                    terminal: false,
                    filter: [ TargetType.SPRITE, TargetType.STAGE ],
                    arguments: {
                        QUESTION: {
                            defaultValue: 'Mặt trời mọc ở hướng nào?',
                            type: ArgumentType.STRING
                        }
                    }
                },
                {
                    opcode: 'setSpeechToTextKey',
                    blockType: BlockType.COMMAND,
                    text: 'set Deepgram API key to [API_KEY]',
                    arguments: {
                        API_KEY: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        }
                    }
                },
                {
                    opcode: 'speechToText',
                    blockType: BlockType.REPORTER,
                    text: 'speech to text for [SECONDS] seconds with language [LANGUAGE]',
                    arguments: {
                        SECONDS: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 6
                        },
                        LANGUAGE: {
                        type: ArgumentType.STRING,
                        defaultValue: 'vi'
                        }
                    }
                }
            ]
        };
    }


    /**
     * implementation of the block with the opcode that matches this name
     *  this will be called when the block is used
     */
    myFirstBlock ({ BOOK_NUMBER }) {
        return fetch('https://openlibrary.org/isbn/' + BOOK_NUMBER + '.json')
          .then((response) => {
            if (response.ok) {
              return response.json();
            }
            else {
              return { title: 'Unknown' };
            }
          })
          .then((bookinfo) => {
            return bookinfo.title;
          });
      }
    
    /**
     * Implementation of the ask AI block.
     * This block sends the question to your LLM API and returns the answer.
     */
    askAI({ QUESTION }) {
        // Optionally, trigger a broadcast or update a "loading" variable here
        // For example: this.runtime.triggerTargetEvent('broadcast', { name: 'startWaiting' });
        // Construct the API URL using your FastAPI endpoint
        // alert("starting ask AI");
        const url = `https://api-staging-2.fikaielts2.com/v1/feedback/ask_AI?question=${encodeURIComponent(QUESTION)}`;
        
        const stage = this.runtime.getTargetForStage() || this.runtime.targets.find(target => target.isStage);
        const signalVar = Object.values(stage.variables).find(v => v.name === "AI Signal");
        const variable = Object.values(stage.variables).find(v => v.name === "AI Answer");

        fetch(url)
          .then(response => {
            //   alert("response:" + response);
              if (response.ok) {
                //  alert("OK response");
                  return response.json();
              }
              throw new Error('API request failed');
          })
          .then(data => {
            // alert("API call successful, data received:" + JSON.stringify(data));
            
            if (stage) {
                // alert("Stage object retrieved:"+ stage);
               // Update a Scratch variable (assume it's called "AI Answer")
                
                if (variable) {
                    // alert("Variable 'AI Answer' found:" +  variable);
                    variable.value = data.response;
                    // alert("Variable 'AI Answer' updated with value:" + data.response);
                    if (signalVar) {
                        // Update the signal variable (for example, with a new timestamp)
                        signalVar.value = "Success";
                        // alert("Broadcast Signal updated to: " + signalVar.value);
                    } else {
                        alert("Ask AI error: Variable 'AI Signal' not found.");
                    }
                } else {
                    alert("Ask AI error: Variable 'AI Answer' not found on the stage.");
                }   
            }
            else {
                alert("Ask AI error: Stage object not found.");
            }
          })
          .catch(error => {
            // alert('Error in askAI:' + error);
            // Update a signal variable to simulate a broadcast (e.g., "Broadcast Signal")
            if (signalVar) {
                // Update the signal variable (for example, with a new timestamp)
                signalVar.value = "Error";
                alert("Ask AI error: " + error);
                variable.value = "Oops! Please try again!"
            } else {
                alert("Ask AI error: 'AI Signal' variable not found.");
            }
          });
    }

    /**
     * Store the Deepgram key from the user.
     */
    setSpeechToTextKey ({ API_KEY }) {
        this._deepgramKey = API_KEY.trim();
    }

    /**
     * Record audio, send to Deepgram, return the transcript.
     * Returns a Promise which Scratch will await.
     */
    speechToText ({ SECONDS, LANGUAGE }) {
        if (!this._deepgramKey) {
            return Promise.resolve('Error: no Deepgram API key set');
        }
        const durationMs = Math.max(1, Number(SECONDS) || 5) * 1000;

        const model = 'nova-2';
        const language = LANGUAGE.trim() || 'vi';

        return navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const recorder = new MediaRecorder(stream);
                const chunks = [];
                recorder.ondataavailable = e => chunks.push(e.data);
                recorder.start();

                return new Promise(resolve =>
                    setTimeout(() => {
                        recorder.stop();
                        recorder.onstop = () => {
                            stream.getTracks().forEach(t => t.stop());
                            resolve(new Blob(chunks, { type: recorder.mimeType }));
                        };
                    }, durationMs)
                );
            })
            .then(blob => {
                const params = new URLSearchParams({
                punctuate: 'true',
                model,
                language
                });
                const url = `https://api.deepgram.com/v1/listen?${params.toString()}`;
                return fetch(
                    url,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Token ' + this._deepgramKey,
                            'Content-Type': blob.type
                        },
                        body: blob
                    }
                );
            })
            .then(res => {
                if (!res.ok) throw new Error('Deepgram error ' + res.status);
                return res.json();
            })
            .then(json => {
                const alt = json.results.channels[0].alternatives[0];
                return alt.transcript || '';
            })
            .catch(err => 'Error: ' + err.message);
    }
}

module.exports = Scratch3YourExtension;
