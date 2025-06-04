sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/Sorter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
  ],
  (BaseController, Filter, Sorter, FilterOperator, Fragment, MessageBox) => {
    "use strict";

    return BaseController.extend("ui5.odata.test.controller.App", {
      onInit() {
        //* Dialog object
        this._mDialogs = {};
      },

      //! Navigation Function
      onPressRow(oEvent) {
        const oItem = oEvent.getSource();
        const oRouter = this.getOwnerComponent().getRouter();

        oRouter.navTo("review", {
          bookId: window.encodeURIComponent(
            oItem.getBindingContext().getPath().substring(1)
          ),
        });
      },

      //! Dialog Function
      async _getDialog(sFragmentName, sDialogId) {
        if (!this._mDialogs[sFragmentName]) {
          const oDialog = await Fragment.load({
            id: sDialogId || this.getView().getId(),
            name: sFragmentName,
            controller: this,
          });
          this.getView().addDependent(oDialog);
          this._mDialogs[sFragmentName] = oDialog;
        }
        return this._mDialogs[sFragmentName];
      },
      async _onDialogCancelPress(sDialogName) {
        const sFragmentId = this.getView().getId();
        const oDialog = Fragment.byId(sFragmentId, sDialogName);
        if (oDialog) {
          oDialog.close();
        }
      },

      //! Get the First Selected Row
      async _getFirstRow({ tableId = "appTable", returnObject = true } = {}) {
        const oTable = this.byId(tableId);
        const aSelectedContexts = oTable.getSelectedContexts();
        if (aSelectedContexts.length === 0) {
          sap.m.MessageToast.show("No row selected.");
          return null;
        }
        return returnObject
          ? aSelectedContexts[0].getObject()
          : aSelectedContexts[0];
      },

      //! Get the Selected Rows
      async _getSelectedRows({
        tableId = "appTable",
        returnObject = true,
      } = {}) {
        const oTable = this.byId(tableId);
        const aSelectedContexts = oTable.getSelectedContexts();
        if (aSelectedContexts.length === 0) {
          sap.m.MessageToast.show("No row selected.");
          return null;
        }
        return returnObject ? aSelectedContexts.getObject() : aSelectedContexts;
      },

      //! Delete (Soft Delete)
      async _onDeleteConfirm(oData) {
        try {
          oData.forEach(function (oData) {
            oData.setProperty("isDeleted", true);
          });
          sap.m.MessageToast.show("Delete success");
          const oTable = this.byId("appTable");
          const oBinding = oTable.getBinding("items");
          oBinding.refresh();
        } catch (error) {
          console.error("Error while Deleting", error);
        }
      },
      async onDeletePress() {
        const oData = await this._getSelectedRows({ returnObject: false });
        if (!oData) {
          return;
        }
        MessageBox.confirm("Are you sure want to delete the row(s)?", {
          actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
          emphasizedAction: MessageBox.Action.OK,
          onClose: function (sAction) {
            if (sAction == "OK") {
              this._onDeleteConfirm(oData);
            } else {
              return;
            }
          }.bind(this),
          dependentOn: this.getView(),
        });
      },

      //! Create
      async onCreatePress(oEvent) {
        // create dialog lazily
        const oDialog = await this._getDialog(
          "ui5.odata.test.view.fragment.CreateData"
        );
        oDialog.open();
      },
      async onCreateConfirmPress(oEvent) {
        // Get input values (trim whitespace)
        var oTitle = this.byId("inputTitle").getValue().trim();
        var oIsbn = this.byId("inputIsbn").getValue().trim();
        var oDesc = this.byId("inputDesc").getValue().trim();
        // Set default to 0 if empty/NaN for stock and price
        var oStock = parseInt(this.byId("inputStock").getValue()) || 0;
        var oPrice = this.byId("inputPrice").getValue() || "0";
        var oBook = {
          title: oTitle,
          isbn: oIsbn,
          descr: oDesc,
          stock: oStock,
          price: oPrice,
        };
        console.log(oBook);
        try {
          var oListBinding = this.getView().getModel().bindList("/Books");
          var oContext = oListBinding.create(oBook);
          this.getView().setBindingContext(oContext);
          sap.m.MessageToast.show("Book created successfully");
          var oTable = this.byId("appTable");
          var oBinding = oTable.getBinding("items");
          oBinding.refresh();
          // Reset input fields when opening the dialog
          this.byId("inputTitle").setValue("");
          this.byId("inputIsbn").setValue("");
          this.byId("inputDesc").setValue("");
          this.byId("inputStock").setValue("");
          this.byId("inputPrice").setValue("");
          this.byId("createDialog").close();
        } catch (error) {
          console.error("Error when creating", error);
        }
      },
      onCreateCancelPress: async function () {
        // Reset input fields when opening the dialog
        this.byId("inputTitle").setValue("");
        this.byId("inputIsbn").setValue("");
        this.byId("inputDesc").setValue("");
        this.byId("inputStock").setValue("");
        this.byId("inputPrice").setValue("");
        this._onDialogCancelPress("createDialog");
      },

      //! Edit
      async onEditPress() {
        const oData = await this._getFirstRow();
        if (!oData) {
          // Check if no row is selected
          return; // Exit early
        }
        const fragmentId = this.getView().getId();
        const oEditDialog = await this._getDialog(
          "ui5.odata.test.view.fragment.EditData"
        );
        // Set the context to the dialog so fields are pre-filled
        Fragment.byId(fragmentId, "editInputTitle").setValue(oData.title);
        Fragment.byId(fragmentId, "editInputIsbn").setValue(oData.isbn);
        Fragment.byId(fragmentId, "editInputDesc").setValue(oData.descr);
        Fragment.byId(fragmentId, "editInputStock").setValue(oData.stock);
        Fragment.byId(fragmentId, "editInputPrice").setValue(oData.price);
        oEditDialog.setModel(this.getView().getModel());
        oEditDialog.open();
      },
      async onEditConfirmPress() {
        const oData = await this._getFirstRow({ returnObject: false });
        const oTitle = this.byId("editInputTitle").getValue();
        const oIsbn = this.byId("editInputIsbn").getValue();
        const oDesc = this.byId("editInputDesc").getValue();
        const oStock = parseInt(this.byId("editInputStock").getValue());
        const oPrice = this.byId("editInputPrice").getValue();

        try {
          // Set new values on the context
          oData.setProperty("title", oTitle);
          oData.setProperty("isbn", oIsbn);
          oData.setProperty("descr", oDesc);
          oData.setProperty("stock", oStock);
          oData.setProperty("price", oPrice);
          sap.m.MessageToast.show("Book updated successfully");
          this.byId("editDialog").close();
        } catch (error) {
          console.error("Error when updating", error);
        }
      },
      onEditCancelPress: function () {
        this._onDialogCancelPress("editDialog");
      },

      //! Filter
      onFilterItems(oEvent) {
        // build filter array
        const aFilter = [];
        const sQuery = oEvent.getParameter("query");
        if (sQuery) {
          aFilter.push(new Filter("title", FilterOperator.Contains, sQuery));
        }
        // filter binding
        const oList = this.byId("appTable");
        const oBinding = oList.getBinding("items");
        oBinding.filter(aFilter);
      },

      //! Sort
      async onSortPress() {
        const oDialog = await this._getDialog(
          "ui5.odata.test.view.fragment.SortDialog"
        );
        oDialog.open();
      },
      onSortDialogConfirm: function (oEvent) {
        var oTable = this.byId("appTable"),
          mParams = oEvent.getParameters(),
          oBinding = oTable.getBinding("items"),
          sPath,
          bDescending,
          aSorters = [];
        sPath = mParams.sortItem.getKey();
        bDescending = mParams.sortDescending;
        aSorters.push(new Sorter(sPath, bDescending));
        // apply the selected sort and group settings
        oBinding.sort(aSorters);
      },
    });
  }
);
