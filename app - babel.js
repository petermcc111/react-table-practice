const headers = [
"Book",
"Author",
"Language",
"Published",
"Sales"];

const data = [
["The Lord of the Rings","J. R. R. Tolkien","English","1954-1955","150 million"],
["Le Petit Prince (The Little Prince)","Antoine de Saint-Exupery","French","1943","140 million"],
["Harry Potter and the Pilosopher's Stone","J. K. Rowling","English","1997","107 million"],
["And Then There Were None","Agatha Christie","English","1939","100 million"],
["Dream of the Red Chamber","Cao Xueqin","Chinese","1754-1791","100 million"],
["The Hobbit","J. R. R. Tolkien","English","1937","100 million"],
["She: A History of Adventure","H. Rider Haggard","English","1887","100 million"]
];

// source: List of best-selling books (https://en.wikipedia.org/wiki/List_of_best-selling_books)

class Excel extends React.Component{
	constructor(props){
		//props never changed

		super(props);
		// equivalent to getInitialState
		this.state = {
			data:this.props.initialData,
			descending:false,
			edit:null, //{row:index,cell:index}
			sortby:null,
			search: false,
		};

		this._log=[];
		this.xclass = this.props.defaultClass;

		//binding methods
		this._download = this._download.bind(this);
		this._logSetState=this._logSetState.bind(this);
		this._replay = this._replay.bind(this);
		this._save = this._save.bind(this);
		this._search = this._search.bind(this);
		this._showEditor = this._showEditor.bind(this);
		this._sort = this._sort.bind(this);
		this._toggleSearch = this._toggleSearch.bind(this);
		this._renderSearch = this._renderSearch.bind(this);	
		this._renderTable = this._renderTable.bind(this);
		this._renderToolbar = this._renderToolbar.bind(this);
		
		console.log("loaded binding");
	}

	componentDidMount(){
		document.onkeydown=function(e){
			console.log("xkey")
			// keyboard R (kcode 82)
			if(e.altKey&&e.shiftKey&&e.keyCode===82)this._replay()
		}.bind(this)
		console.log("componentdidmunt finished (56)");
	}

	_download(format,ev){
		// downloading data into json / csv format
		var contents = format==='json' ? JSON.stringify(this.state.data) 
			: this.state.data.reduce((result,row)=>(
				result + row.reduce((rowresult,cell,idx)=>(
					rowresult + '"' + cell.replace(/"/g,'""') + '"' + (idx<row.length-1?',':'')
				),'') + "\n"
			),'');
		var URL = window.URL || window.webkitURL;
		var blob = new Blob([contents],{type:'text/'+format});
		ev.target.href=URL.createObjectURL(blob);
		ev.target.download='data.'+format;
	}

	_logSetState(newState){
		this._log.push((JSON.stringify(
			this._log.length===0?this.state:newState)))
		this.setState(newState);
	}

	_replay(){
		console.log("replay")
		if(this._log.length===0){
			console.log('No state to replay yet');
			return;
		}
		var idx=1;
		var interval = setInterval(function(){
			idx++;
			if(idx===this._log.length-1){ //the end
				clearInterval(interval);
			}
			this.setState(this._log[idx]);
		}.bind(this),1000);
	}

	_save(event){
		// save the changes
		console.log("savev in")
		event.preventDefault();
		var input = event.target.firstChild;
		var data = this.state.data.slice();
		data[this.state.edit.row][this.state.edit.cell] = input.value;
		this.setState({
			edit:null, // ended editing
			data:data,
		})
		console.log("save out")
	}

	_search(event){
		// do search event
		console.log("search in")
		var needle = event.target.value.toLowerCase();
		if(!needle){
			this.setState({data:this._preSearchData});return;
		}
		var idx = event.target.dataset.idx;
		var searchData = this._preSearchData.filter((row) =>
			(row[idx].toString().toLowerCase().indexOf(needle)>-1)
		)
		this.setState({data:searchData})
		console.log("search out")
	}

	_showEditor(event){
		this.setState({edit: {
			row: parseInt(event.target.dataset.row,10),
			cell: event.target.cellIndex
		}})
	}

	_sort(event){
		// sorting list based on alphabetical order of certain column
		console.log("sort in")
		var col = event.target.cellIndex;
		var data = this.state.data.slice();
		var descending = this.state.sortby === col && !this.state.descending;
		data.sort((a,b)=>(descending?(a[col]>b[col]?1:-1):(a[col]<b[col]?1:-1)));
		this.setState({data:data,sortby:col,descending:descending});
		console.log("sort out")
	}
	
	_toggleSearch(){
		// initialize search event
		if (this.state.search){
			this.setState({
				data:this._preSearchData,
				search:false
			})
			this._preSearchData = null;
		}else{
			this._preSearchData = this.state.data;
			this.setState({search:true});
		}
	}

	_renderSearch(){
		// render search
		return (!this.state.search) ? null :
			(<tr onChange={this._search}>
				{this.props.headers.map(
					(_ignore,idx)=><td key={idx}><input type="text" data-idx={idx} /></td>
			)}
		</tr>);
	}
	
	_renderToolbar(){return (
		// render search  button and export to JSON/CSV toolbar
		<div className='toolbar'>
			<button onClick={this._toggleSearch} className="toolbar">search</button>
			<button onClick={this._download.bind(this,'json')} href="data.json">Export JSON</button>
			<button onClick={this._download.bind(this,'csv')} href="data.csv">Export CSV</button>
		</div>
	)}

	_renderTable(){
		// main interface
		var excel = this;
		console.log("renderTable");
		var title = excel.props.headers.map(function(itemTitle,index){
			if (excel.state.sortby === index) {
				itemTitle += excel.state.descending?' \u2191':' \u2193';
			}
			return (<th key={index}>{itemTitle}</th>);
		});
		return(<table className={this.xclass}>
			<thead onClick={this._sort}>
				<tr>{title}</tr>
			</thead>
			<tbody onDoubleClick={this._showEditor}>
				{this._renderSearch(),
				this.state.data.map((row,rIndex) => 
				<tr key={rIndex}>
					{row.map((cell,cIndex)=>{
						var edit = excel.state.edit;
						var NCell = (edit && edit.row===rIndex && edit.cell===cIndex) 
							? React.createElement('form', {onSubmit:excel._save},
								React.createElement('input', {type:"text",defaultValue:cell},null))
							: cell;
						return (<td key={cIndex} data-row={rIndex}>{NCell}</td>);
					})}
				</tr>)}
			</tbody>
		</table>)
	}

	render(){return (<div>
			{this._renderToolbar()}{this._renderTable()}
			</div>
	)}
};


(function(){ReactDOM.render(
	<Excel headers={headers} initialData={data} defaultClass="table" />, document.querySelector("#app")
	)})();