import React from "react"
import PropTypes from "prop-types"
import _ from "lodash"
import "./jqueryloader.js"
import $ from "jquery"
require("datatables.net")
require("./datatable.inlineeditor")
require("datatables.net-buttons")(window, $)
require("datatables.net-select")
require("./datatable.alteditor")

export default class DataTable extends React.Component {
  componentDidMount() {
    this.table = this.datatable(this.props.data)
  }

  componentWillUnmount() {
    this.table.destroy(true)
  }

  shouldComponentUpdate = nextProps => {
    this.refresh(nextProps.options.data)
    return false
  }

  refresh = data => {
    this.table.clear()
    this.table.rows.add(data)
    this.table.draw()
  }

  getData = () => {
    let rows = []
    let data = this.table.rows().data()
    for (var i = 0; i < data.length; i++) rows.push(data[i])
    return rows
  }

  onInlineUpdateData = (cell, row, oldValue) => {
    if (this.props.onUpdate) this.props.onUpdate(this.getData())
  }

  onAltUpdateData = (datatable, rowdata, success, error) => {
    success(rowdata)
    if (this.props.onUpdate) this.props.onUpdate(this.getData())
  }

  datatable() {
    const element = $(this.refs.table)
    let { options } = { ...this.props } || {}

    options = _.extend(options, {
      dom:
        "t<'row' l i><'pagination d-flex align-items-center ml-0 justify-content-end' p>",
      oLanguage: {
        sSearch: "<i class='glyphicon glyphicon-search'></i>",
        sInfo: "<div class='total__entries'>Total:  <span>_TOTAL_</span></div>",
        sLengthMenu: "<span class='name'>Show entries</span> _MENU_",
        oPaginate: {
          sPrevious:
            '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24"><path d="M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z"></path><path d="M0-.5h24v24H0z" fill="none"></path></svg>',
          sNext:
            '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24"><path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z"></path><path d="M0-.25h24v24H0z" fill="none"></path></svg>'
        }
      },
      autoWidth: false,
      retrieve: false,
      responsive: false
    })

    if (options.editable) {
      options = {
        altEditor: true,
        buttons: [
          {
            text: "Add",
            className: "button",
            name: "add" // do not change name
          },
          {
            extend: "selected", // Bind to Selected row
            text: "Edit",
            className: "button",
            name: "edit" // do not change name
          },
          {
            extend: "selected", // Bind to Selected row
            className: "button",
            text: "Delete",
            name: "delete" // do not change name
          }
        ],
        responsive: true,
        select: {
          info: false,
          className: "dt-selected",
          style: "single"
        },
        onAddRow: this.onAltUpdateData,
        onEditRow: this.onAltUpdateData,
        onDeleteRow: this.onAltUpdateData,
        ...options
      }
      options.dom =
        "t<'row' l i>B<'pagination d-flex align-items-center ml-0 justify-content-end' p>"
      options.columns = [
        ...options.columns,
        { data: null, defaultContent: '' }
      ]
    }

    const _dataTable = element.DataTable(options)

    if (options.editable) {
      _dataTable.MakeCellsEditable({
        onUpdate: this.onInlineUpdateData
      })
    }

    if (this.props.filter) {
      // Apply the filter
      element.on("keyup change", "thead th input[type=text]", function () {
        _dataTable
          .column(
            $(this)
              .parent()
              .index() + ":visible"
          )
          .search(this.value)
          .draw()
      })
    }

    if (this.props.detailsFormat) {
      const format = this.props.detailsFormat
      element.on("click", "td.details-control", function () {
        const tr = $(this).closest("tr")
        const row = _dataTable.row(tr)
        if (row.child.isShown()) {
          row.child.hide()
          tr.removeClass("shown")
        } else {
          row.child(format(row.data())).show()
          tr.addClass("shown")
        }
      })
    }

    return _dataTable
  }

  addNewRow = () => {
    let { options } = { ...this.props } || {}
    let columns = options.columns.map(col => col.data)
    let newRow = {}
    columns.forEach(col => {
      newRow[col] = this.refs["input_" + col].value
      this.refs["input_" + col].value = ''
    })
    let rows = []
    rows.push(newRow)
    this.table.rows.add(rows).draw()
    if (this.props.onUpdate) this.props.onUpdate(this.getData())
  }

  keyPressOnAdd = event => {
    if (event.key === 'Enter') {
      let { options } = { ...this.props } || {}
      let columns = options.columns.map(col => col.data)
      const index = _.indexOf(columns, event.target.name)
      if (index < columns.length - 1) {
        console.log('input_' + columns[index + 1])
        this.refs['input_' + columns[index + 1]].focus()
        this.refs['input_' + columns[index + 1]].select()
      } else {
        this.addNewRow()
        this.refs['input_' + columns[0]].focus()

      }
    }
  }

  renderNewRow = () => {
    let { options } = { ...this.props } || {}
    let columns = options.columns.map(col => col.data)
    return (
      <tfoot style={{ display: 'table-row-group' }}>
        <tr>
          {columns.map((col, i) => (
            <th key={'new' + i}>
              <input type="text" ref={"input_" + col} onKeyPress={this.keyPressOnAdd} name={col} />
            </th>
          ))}
          <th>
            <button onClick={this.addNewRow} className="button">
              Add
            </button>
          </th>
        </tr>

      </tfoot>
    )
  }

  render() {
    const {
      children,
      options,
      detailsFormat,
      onUpdate,
      ...props
    } = this.props
    return (
      <table {...props} ref="table">
        {options.editable && this.renderNewRow()}
        {children}
      </table>
    )
  }
}

DataTable.defaultProps = {}

DataTable.propTypes = {
  data: PropTypes.array,
  options: PropTypes.object.isRequired,
  children: PropTypes.object
}
