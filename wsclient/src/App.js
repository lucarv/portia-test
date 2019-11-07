import React, { Component } from 'react';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import { Container, Form, InputGroup, FormControl, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
const client = new W3CWebSocket('ws://kuman:8080');

class App extends Component {
	state = {
		agentId: '',
		latency: 'Not Yet Recorded',
		connectionState: 'Disconnected',
	};

	componentDidMount() {
		client.onopen = () => {
			this.setState({ "connectionState": "Connected to server. Please Set Agent Id"});
		};
		client.onmessage = message => {
			let msg = JSON.parse(message.data);
			if (msg.hasOwnProperty('timestamp')) {
				let latency = Date.now() - msg.timestamp;
				this.setState({ latency });
			} 
		};
	}

	onChange = e => {
		this.setState({
			[e.target.name]: e.target.value,
		});
	};

	onSubmit = e => {
		e.preventDefault();
		this.setState({
			[e.target.name]: '',
		});
		this.setState({ "connectionState": "Logged In"});
		client.send(
			JSON.stringify({
				type: 'agent login',
				agentId: this.state.agentId,
			})
		);
	};

	render() {
		return (
			<Container>
				<Form onSubmit={this.onSubmit}>
				<InputGroup style={{ padding: '10px' }}>
					<FormControl required type="text" placeholder="Agent Id" name="agentId" value={this.state.agentId} onChange={this.onChange} />
					<InputGroup.Append>
						<Button style={{ background: '#4CAF50', color: 'white', border: 0 }} type="submit" value="submit" >
							Set >>
						</Button>
					</InputGroup.Append>
				</InputGroup>
				</Form>
				<br /><br />
				<InputGroup style={{ padding: '10px' }}>
					<InputGroup.Text id="inputGroup-sizing-default">Latency</InputGroup.Text>
					<FormControl readOnly type="text" name="latency" value={this.state.latency} />
				</InputGroup>
				<InputGroup style={{ padding: '10px' }}>
				    <InputGroup.Text id="inputGroup-sizing-default">Status </InputGroup.Text>
					<FormControl readOnly type="text" name="status" value={this.state.connectionState} />
				</InputGroup>
			</Container>
		);
	}
}

export default App;
