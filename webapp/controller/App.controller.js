sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/Sorter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/ui/Device",
  ],
  (BaseController, Filter, Sorter, FilterOperator, Fragment, Device) => {
    "use strict";

    return BaseController.extend("ui5.odata.test.controller.App", {
      onInit() {
        //* Keeps reference to any of the created sap.m.ViewSettingsDialog-s in this sample
        this._mViewSettingsDialogs = {};

        //* Open Column Menu
        var oView = this.getView();
        Fragment.load({
          id: this.getView().getId(),
          name: "ui5.odata.test.view.fragment.ColumnMenu",
          controller: this,
        }).then(function (oMenu) {
          oView.addDependent(oMenu);
          return oMenu;
        });
      },

      onSortChange(oEvent) {
        const oTable = this.byId("appTable");
        const oBinding = oTable.getBinding("items");
        const oQuickSortItem = oEvent.getParameter("item");
        if (oQuickSortItem.getSortOrder() === "None") {
          oBinding.sort();
        } else {
          oBinding.sort([
            new Sorter(
              oQuickSortItem.getKey(),
              oQuickSortItem.getSortOrder() === "Descending"
            ),
          ]);
        }
      },

      async onCreatePress(oEvent) {
        // create dialog lazily
        this.oDialog ??= await this.loadFragment({
          name: "ui5.odata.test.view.fragment.CreateData",
        });

        this.oDialog.open();
      },

      async onCreateConfirmPress(oEvent) {
        var oTitle = this.byId("inputTitle").getValue();
        var oIsbn = this.byId("inputIsbn").getValue();
        var oDesc = this.byId("inputDesc").getValue();
        var oStock = parseInt(this.byId("inputStock").getValue());
        var oPrice = this.byId("inputPrice").getValue();
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
          this.byId("createDialog").close();
        } catch (error) {
          console.error("Error", error);
        }
      },

      onCreateCancelPress: async function () {
        this.byId("createDialog").close();
      },

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

      async onSortPress() {
        this.getViewSettingsDialog(
          "ui5.odata.test.view.fragment.SortDialog"
        ).then(function (oViewSortDialog) {
          oViewSortDialog.open();
        });
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
      getViewSettingsDialog: function (sDialogFragmentName) {
        var pDialog = this._mViewSettingsDialogs[sDialogFragmentName];
        if (!pDialog) {
          pDialog = Fragment.load({
            id: this.getView().getId(),
            name: sDialogFragmentName,
            controller: this,
          }).then(function (oDialog) {
            if (Device.system.desktop) {
              oDialog.addStyleClass("sapUiSizeCompact");
            }
            return oDialog;
          });
          this._mViewSettingsDialogs[sDialogFragmentName] = pDialog;
        }
        return pDialog;
      },
    });
  }
);
