const Button = (props) => {
  const color = props.state ? 'green' : 'red';

  return (
    <div className="button-round" style={{backgroundColor: color}}></div>
  );
};

class SimonGame extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      on: false,
      strict: false,
      started: false,
      count: 0,
      highlighted: false
    };

    this.audio = this.initAudio();
  }

  initAudio = () => {
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;

      let audioContext = new AudioContext();
      let sectorSounds = {};

      const sounds = ['red', 'blue', 'green', 'yellow'];
      const frequencies = [329.63, 261.63, 220, 164.81];

      let errOsc = audioContext.createOscillator();
      errOsc.type = 'triangle';
      errOsc.frequency.value = 110;
      errOsc.start(0.0);

      let errNode = audioContext.createGain();
      errOsc.connect(errNode);
      errNode.gain.value = 0;
      errNode.connect(audioContext.destination);

      const ramp = 0.05;
      const vol = 0.5;

      let oscillators = frequencies.map((frq) => {
        let osc = audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = frq;
        osc.start(0.0);

        return osc;
      });

      let gainNodes = oscillators.map((osc) => {
        let g = audioContext.createGain();
        osc.connect(g);
        g.connect(audioContext.destination);
        g.gain.value = 0;

        return g;
      });

      function playErrTone() {
        errNode.gain.linearRampToValueAtTime(vol, audioContext.currentTime + ramp);
      }

      function stopErrTone() {
        errNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + ramp);
      }

      function playGoodTone(sector) {
        sectorSounds[sector].gain.linearRampToValueAtTime(vol, audioContext.currentTime + ramp);
      }

      function stopGoodTones() {
        for (let sound of sounds) {
          sectorSounds[sound].gain.linearRampToValueAtTime(0, audioContext.currentTime + ramp);
        }
      }

      const soundsCount = sounds.length;

      for (let i = 0; i < soundsCount; i++) {
        sectorSounds[sounds[i]] = gainNodes[i];
      }

      return {
        playErrTone,
        stopErrTone,
        playGoodTone,
        stopGoodTones
      };
    }
    catch(e) {
      alert('Web Audio API is not supported in this browser');
    }
  };

  handleSectorClickStart = (e) =>  {
    const sector = e.target.id;

    this.audio.playGoodTone(sector);
  };

  handleSectorClickStop = (e) => {
    const sector = e.target.id;

    this.audio.stopGoodTones(sector);
  };

  render() {
    return (
      <div className="container-fluid">
        <div className="row" style={{ height: 100 }}></div>
        <div className="row">
          <div className="col-4"></div>
          <div className="col-4 text-center">
            <div id="circle">
              <div id="red" onMouseDown={this.handleSectorClickStart} onMouseUp={this.handleSectorClickStop}></div>
              <div id="green" onMouseDown={this.handleSectorClickStart} onMouseUp={this.handleSectorClickStop}></div>
              <div id="yellow" onMouseDown={this.handleSectorClickStart} onMouseUp={this.handleSectorClickStop}></div>
              <div id="blue" onMouseDown={this.handleSectorClickStart} onMouseUp={this.handleSectorClickStop}></div>
              <div id="inner-circle" className="text-center">
                <Button state={this.state.started} /><a href="#">Start</a><br />
                <a href="#">Strict</a><br />
                <a href="#">On</a>
              </div>
            </div>
          </div>
          <div className="col-4"></div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  <SimonGame />,
  document.getElementById('root')
);
