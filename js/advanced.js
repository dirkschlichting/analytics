/**
 * Analytics
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the LICENSE.md file.
 *
 * @author Marcel Scherello <audioplayer@scherello.de>
 * @copyright 2020 Marcel Scherello
 */
/** global: OCA */
/** global: OCP */
/** global: OC */
'use strict';

/**
 * @namespace OCA.Analytics.Advanced
 */
OCA.Analytics.Advanced = {};

/**
 * @namespace OCA.Analytics.Advanced.Dataload
 */
OCA.Analytics.Advanced.Dataload = {
    datasourceTemplates: [],
    dataloadArray: [],

    tabContainerDataload: function () {
        const datasetId = document.getElementById('app-sidebar').dataset.id;

        OCA.Analytics.Sidebar.resetView();
        document.getElementById('tabHeaderDataload').classList.add('selected');
        document.getElementById('tabContainerDataload').classList.remove('hidden');
        document.getElementById('tabContainerDataload').innerHTML = '<div style="text-align:center; word-wrap:break-word;" class="get-metadata"><p><img src="' + OC.imagePath('core', 'loading.gif') + '"><br><br></p><p>' + t('analytics', 'Reading data') + '</p></div>';

        $.ajax({
            type: 'GET',
            url: OC.generateUrl('apps/analytics/dataload/') + datasetId,
            success: function (data) {
                let table;
                table = document.getElementById('templateDataload').cloneNode(true);
                table.id = 'tableDataload';
                document.getElementById('tabContainerDataload').innerHTML = '';
                document.getElementById('tabContainerDataload').appendChild(table);
                document.getElementById('createDataloadButton').addEventListener('click', OCA.Analytics.Advanced.Dataload.handleDataloadCreateButton);
                document.getElementById('dataloadList').innerHTML = '';
                for (let dataload of data['dataloads']) {
                    const li = OCA.Analytics.Advanced.Dataload.buildDataloadRow(dataload);
                    document.getElementById('dataloadList').appendChild(li);
                }
                for (let key in data['datasources']) {
                    let value = data['datasources'][key];
                    let option = document.createElement('option');
                    option.value = key;
                    option.innerText = value;
                    document.getElementById('dataloadType').appendChild(option);
                }

                OCA.Analytics.Advanced.Dataload.datasourceTemplates = data['templates'];
                OCA.Analytics.Advanced.Dataload.dataloadArray = data['dataloads'];
            }
        });
    },

    handleDataloadCreateButton: function () {
        OCA.Analytics.Advanced.Dataload.createDataload();
    },

    handleDataloadUpdateButton: function () {
        OCA.Analytics.Advanced.Dataload.updateDataload();
    },

    handleDataloadDeleteButton: function () {
        OC.dialogs.confirm(
            t('analytics', 'Are you sure?'),
            t('analytics', 'Delete Dataload'),
            function (e) {
                if (e === true) {
                    OCA.Analytics.Advanced.Dataload.deleteDataload();
                }
            },
            true
        );
    },

    handleDataloadEditClick: function (evt) {
        OCA.Analytics.Advanced.Dataload.bildDataloadDetails(evt);
    },

    handleDataloadExecuteButton: function () {
        OCA.Analytics.Advanced.Dataload.executeDataload();
    },

    buildDataloadRow: function (dataload) {

        let item = document.createElement('div');
        item.classList.add('dataloadItem');

        let typeINT = parseInt(dataload.datasource);
        let typeIcon;
        if (typeINT === OCA.Analytics.TYPE_INTERNAL_FILE) {
            typeIcon = 'icon-file';
        } else if (typeINT === OCA.Analytics.TYPE_INTERNAL_DB) {
            typeIcon = 'icon-projects';
        } else if (typeINT === OCA.Analytics.TYPE_GIT || typeINT === OCA.Analytics.TYPE_EXTERNAL_FILE) {
            typeIcon = 'icon-external';
        } else {
            typeIcon = 'icon-external';
        }
        let a = document.createElement('a');
        //a.setAttribute('href', '#');
        a.classList.add(typeIcon);
        a.innerText = dataload.name;
        a.dataset.id = dataload.id;
        a.dataset.datasourceId = dataload.datasource;
        a.addEventListener('click', OCA.Analytics.Advanced.Dataload.handleDataloadEditClick);
        item.appendChild(a);
        return item;
    },

    bildDataloadDetails: function (evt) {
        let dataload = OCA.Analytics.Advanced.Dataload.dataloadArray.find(x => x.id === parseInt(evt.target.dataset.id));
        if (!dataload) dataload = OCA.Analytics.Advanced.Dataload.dataloadArray.find(x => x.id === evt.target.dataset.id);
        let template = OCA.Analytics.Advanced.Dataload.datasourceTemplates[evt.target.dataset.datasourceId];

        document.getElementById('dataloadDetail').dataset.id = dataload.id;
        document.getElementById('dataloadName').value = dataload.name;
        document.getElementById('dataloadDetailHeader').hidden = false;
        document.getElementById('dataloadDetailButtons').hidden = false;
        document.getElementById('dataloadUpdateButton').addEventListener('click', OCA.Analytics.Advanced.Dataload.handleDataloadUpdateButton);
        document.getElementById('dataloadDeleteButton').addEventListener('click', OCA.Analytics.Advanced.Dataload.handleDataloadDeleteButton);
        document.getElementById('dataloadSchedule').value = dataload.schedule;
        document.getElementById('dataloadSchedule').addEventListener('change', OCA.Analytics.Advanced.Dataload.updateDataload);
        document.getElementById('dataloadOCC').innerText = 'occ analytics:load ' + dataload.id;

        let item = document.getElementById('dataloadDetailItems');
        item.innerHTML = '';

        for (let templateOption of template) {
            // loop all options of the datasourcetemplate and create the input form
            let tablerow = document.createElement('div');
            let label = document.createElement('div');
            label.style.display = 'inline-flex';
            label.classList.add('input250');
            label.innerText = templateOption.name;

            let input;
            if (templateOption.type && templateOption.type === 'tf') {
                input = OCA.Analytics.Advanced.Dataload.buildDataloadDetailSelect(templateOption, dataload);
            } else {
                input = OCA.Analytics.Advanced.Dataload.buildDataloadDetailInput(templateOption, dataload);
            }
            item.appendChild(tablerow);
            tablerow.appendChild(label);
            tablerow.appendChild(input);
        }

        document.getElementById('dataloadRun').hidden = false;
        document.getElementById('dataloadExecuteButton').addEventListener('click', OCA.Analytics.Advanced.Dataload.handleDataloadExecuteButton);
        //scheduleButton.addEventListener('click', OCA.Analytics.Advanced.Dataload.handleDataloadExecuteButton);
        //useButton.addEventListener('click', OCA.Analytics.Advanced.Dataload.handleDataloadExecuteButton);

    },

    buildDataloadDetailInput: function (templateOption, dataload) {
        let input = document.createElement('input');
        input.style.display = 'inline-flex';
        input.classList.add('input250');
        input.placeholder = templateOption.placeholder;
        input.id = templateOption.id;
        let fieldValues = JSON.parse(dataload.option);
        if (templateOption.id in fieldValues) {
            input.value = fieldValues[templateOption.id];
        }
        return input;
    },

    buildDataloadDetailSelect: function (templateOption, dataload) {
        let input = document.createElement('select');
        input.style.display = 'inline-flex';
        input.classList.add('input250');
        input.id = templateOption.id;
        let fieldValues = JSON.parse(dataload.option);

        let selectOptions = templateOption.placeholder.split("/")
        for (let selectOption of selectOptions) {
            let option = document.createElement('option');
            option.value = selectOption;
            option.innerText = selectOption;
            if (templateOption.id in fieldValues && fieldValues[templateOption.id] === selectOption) {
                option.selected = true;
            }
            input.appendChild(option);
        }
        return input;
    },

    createDataload: function () {
        const datasetId = parseInt(document.getElementById('app-sidebar').dataset.id);

        $.ajax({
            type: 'POST',
            url: OC.generateUrl('apps/analytics/dataload'),
            data: {
                'datasetId': datasetId,
                'datasourceId': document.getElementById('dataloadType').value,
            },
            success: function () {
                document.querySelector('.tabHeader.selected').click();
            }
        });
    },

    updateDataload: function () {
        const dataloadId = document.getElementById('dataloadDetail').dataset.id;
        let option = {};

        let inputFields = document.querySelectorAll('#dataloadDetailItems input, #dataloadDetailItems select');
        for (let inputField of inputFields) {
            option[inputField.id] = inputField.value;
        }
        option = JSON.stringify(option);

        $.ajax({
            type: 'PUT',
            url: OC.generateUrl('apps/analytics/dataload/') + dataloadId,
            data: {
                'name': document.getElementById('dataloadName').value,
                'schedule': document.getElementById('dataloadSchedule').value,
                'option': option,
            },
            success: function () {
                OCA.Analytics.UI.notification('success', t('analytics', 'Dataload saved'));
                OCA.Analytics.Advanced.Dataload.dataloadArray.find(x => x.id === parseInt(dataloadId)).schedule = document.getElementById('dataloadSchedule').value;
                OCA.Analytics.Advanced.Dataload.dataloadArray.find(x => x.id === parseInt(dataloadId)).name = document.getElementById('dataloadName').value;
            }
        });
    },

    deleteDataload: function () {
        const dataloadId = document.getElementById('dataloadDetail').dataset.id;
        $.ajax({
            type: 'DELETE',
            url: OC.generateUrl('apps/analytics/dataload/') + dataloadId,
            success: function () {
                document.querySelector('.tabHeader.selected').click();
            }
        });
    },

    executeDataload: function () {
        const dataloadId = document.getElementById('dataloadDetail').dataset.id;
        let mode;
        if (document.getElementById('testrunCheckbox').checked) {
            mode = 'simulate';
        } else {
            mode = 'execute';
        }

        $.ajax({
            type: 'POST',
            url: OC.generateUrl('apps/analytics/dataload/') + mode,
            data: {
                'dataloadId': dataloadId,
            },
            success: function (data) {
                if (mode === 'simulate') {
                    OC.dialogs.message(
                        JSON.stringify(data.data),
                        t('analytics', 'Datasource simulation'),
                        'info',
                        OC.dialogs.OK_BUTTON,
                        function () {
                        },
                        true,
                        true
                    );
                } else {
                    if (data.error === 0) {
                        OCA.Analytics.UI.notification('success', data.insert + t('analytics', ' records inserted, ') + data.update + t('analytics', ' records updated'));
                        //document.querySelector('#navigationDatasets [data-id="' + datasetId + '"]').click();
                    } else {
                        OCA.Analytics.UI.notification('error', data.error);
                    }
                }
            }
        });
    },

};

OCA.Analytics.Advanced.Threshold = {

    tabContainerThreshold: function () {
        const datasetId = document.getElementById('app-sidebar').dataset.id;

        OCA.Analytics.Sidebar.resetView();
        document.getElementById('tabHeaderThreshold').classList.add('selected');
        document.getElementById('tabContainerThreshold').classList.remove('hidden');
        document.getElementById('tabContainerThreshold').innerHTML = '<div style="text-align:center; word-wrap:break-word;" class="get-metadata"><p><img src="' + OC.imagePath('core', 'loading.gif') + '"><br><br></p><p>' + t('analytics', 'Reading data') + '</p></div>';

        $.ajax({
            type: 'GET',
            url: OC.generateUrl('apps/analytics/dataset/') + datasetId,
            success: function (data) {
                let table;
                table = document.getElementById('templateThreshold').cloneNode(true);
                table.id = 'tableThreshold';
                document.getElementById('tabContainerThreshold').innerHTML = '';
                document.getElementById('tabContainerThreshold').appendChild(table);
                document.getElementById('sidebarThresholdTextDimension1').innerText = data.dimension1 || t('analytics', 'Column 1');
                document.getElementById('sidebarThresholdTextValue').innerText = data.value || t('analytics', 'Column 3');
                document.getElementById('createThresholdButton').addEventListener('click', OCA.Analytics.Advanced.Threshold.handleThresholdCreateButton);
                if (parseInt(data.type) !== OCA.Analytics.TYPE_INTERNAL_DB) {
                    document.getElementById('sidebarThresholdSeverity').remove(0);
                }
            }
        });

        $.ajax({
            type: 'GET',
            url: OC.generateUrl('apps/analytics/threshold/') + datasetId,
            success: function (data) {
                if (data !== false) {
                    document.getElementById('sidebarThresholdList').innerHTML = '';
                    for (let threshold of data) {
                        const li = OCA.Analytics.Advanced.Threshold.buildThresholdRow(threshold);
                        document.getElementById('sidebarThresholdList').appendChild(li);
                    }
                }
            }
        });
    },

    handleThresholdCreateButton: function () {
        OCA.Analytics.Advanced.Threshold.createThreashold();
    },

    handleThresholdDeleteButton: function (evt) {
        const thresholdId = evt.target.dataset.id;
        OCA.Analytics.Advanced.Threshold.deleteThreshold(thresholdId);
    },

    buildThresholdRow: function (data) {

        let bulletColor, bullet;
        data.severity = parseInt(data.severity);
        if (data.severity === 2) {
            bulletColor = 'red';
        } else if (data.severity === 3) {
            bulletColor = 'orange';
        } else {
            bulletColor = 'green';
        }

        if (data.severity === 1) {
            bullet = document.createElement('img');
            bullet.src = OC.imagePath('notifications', 'notifications-dark.svg');
            bullet.classList.add('thresholdBullet');
        } else {
            bullet = document.createElement('div');
            bullet.style.backgroundColor = bulletColor;
            bullet.classList.add('thresholdBullet');
        }

        let item = document.createElement('div');
        item.classList.add('thresholdItem');

        let text = document.createElement('div');
        text.classList.add('thresholdText');
        text.innerText = data.dimension1 + ' ' + data.option + ' ' + data.value;

        let tDelete = document.createElement('div');
        tDelete.classList.add('icon-close');
        tDelete.dataset.id = data.id;
        tDelete.addEventListener('click', OCA.Analytics.Advanced.Threshold.handleThresholdDeleteButton);

        item.appendChild(bullet);
        item.appendChild(text);
        item.appendChild(tDelete);
        return item;
    },

    createThreashold: function () {
        const datasetId = parseInt(document.getElementById('app-sidebar').dataset.id);
        const url = OC.generateUrl('apps/analytics/threshold');

        $.ajax({
            type: 'POST',
            url: url,
            data: {
                'datasetId': datasetId,
                'dimension1': document.getElementById('sidebarThresholdDimension1').value,
                'option': document.getElementById('sidebarThresholdOption').value,
                'value': document.getElementById('sidebarThresholdValue').value,
                'severity': document.getElementById('sidebarThresholdSeverity').value,
            },
            success: function () {
                document.querySelector('.tabHeader.selected').click();
            }
        });
    },

    deleteThreshold: function (thresholdId) {

        $.ajax({
            type: 'DELETE',
            url: OC.generateUrl('apps/analytics/threshold/') + thresholdId,
            success: function () {
                document.querySelector('.tabHeader.selected').click();
            }
        });
    },

};

document.addEventListener('DOMContentLoaded', function () {
    OCA.Analytics.Sidebar.registerSidebarTab({
        id: 'tabHeaderDataload',
        class: 'tabContainerDataload',
        tabindex: '2',
        name: t('analytics', 'Dataload'),
        action: OCA.Analytics.Advanced.Dataload.tabContainerDataload,
    });

    OCA.Analytics.Sidebar.registerSidebarTab({
        id: 'tabHeaderThreshold',
        class: 'tabContainerThreshold',
        tabindex: '3',
        name: t('analytics', 'Thresholds'),
        action: OCA.Analytics.Advanced.Threshold.tabContainerThreshold,
    });

});