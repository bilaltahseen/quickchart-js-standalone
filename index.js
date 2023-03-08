const fetch = require('cross-fetch')
const fs = require('fs');
const { stringify } = require('javascript-stringify');
const { renderChartJs } = require('./lib/charts');

const USER_AGENT = `quickchart-js/3.1.0`;

class QuickChartJs {
    constructor() {

        this.chart = undefined;
        this.width = 500;
        this.height = 300;
        this.devicePixelRatio = 1.0;
        this.backgroundColor = '#ffffff';
        this.format = 'png';
        this.version = '2';
        this.isRemote = false;
        this.host = 'quickchart.io';
        this.scheme = 'https';
    }

    setIsRemote() {
        this.isRemote = true
    }

    postJson(url, payload) {
        return fetch(url, {
          method: 'POST',
          headers: {
            'User-Agent': USER_AGENT,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }
      

    getBaseUrl() {
        return `${this.scheme}://${this.host}`;
    }

    setConfig(chartConfig) {
        this.chart = stringify(chartConfig);
        return this;
    }

    setWidth(width) {
        this.width = parseInt(width, 10);
        return this;
    }

    setHeight(height) {
        this.height = parseInt(height, 10);
        return this;
    }

    setBackgroundColor(color) {
        this.backgroundColor = color;
        return this;
    }

    setDevicePixelRatio(ratio) {
        this.devicePixelRatio = parseFloat(ratio);
        return this;
    }

    setFormat(fmt) {
        this.format = fmt;
        return this;
    }

    setChartJsVersion(version) {
        this.version = version;
        return this;
    }

    isValid() {
        if (!this.chart) {
            return false;
        }
        return true;
    }


    getPostData() {
        const { width, height, chart, format, backgroundColor, devicePixelRatio, version } = this;
        const postData = {
            width,
            height,
            chart,
        };
        if (format) {
            postData.format = format;
        }
        if (backgroundColor) {
            postData.backgroundColor = backgroundColor;
        }
        if (devicePixelRatio) {
            postData.devicePixelRatio = devicePixelRatio;
        }
        if (version) {
            postData.version = version;
        }
        return postData;
    }

    async doChartjsRender(opts) {
        if (!opts.chart) {
            opts.failFn('You are missing variable `c` or `chart`');
            return;
        }

        const width = parseInt(opts.width, 10) || 500;
        const height = parseInt(opts.height, 10) || 300;

        let untrustedInput = opts.chart;

        return renderChartJs(
            width,
            height,
            opts.backgroundColor,
            opts.devicePixelRatio,
            opts.version || '2.9.4',
            opts.format,
            untrustedInput,
        )

    }

    renderChartToPng(opts) {
        opts.failFn = this.failPng;
        opts.onRenderHandler = buf => {
            return buf
        };
        return this.doChartjsRender(opts);
    }

    async toBinaryRemote() {
        if (!this.isValid()) {
          throw new Error('You must call setConfig before getUrl');
        }
    
        const resp = await this.postJson(`${this.getBaseUrl()}/chart`, this.getPostData());
        if (!resp.ok) {
          const quickchartError = resp.headers.get('x-quickchart-error');
          const details = quickchartError ? `\n${quickchartError}` : '';
          throw new Error(`Chart creation failed with status code ${resp.status}${details}`);
        }
        const data = await resp.arrayBuffer();
        return Buffer.from(data);
      }

    async toBinary() {
        if (!this.isValid()) {
            throw new Error('You must call setConfig before getUrl');
        }

        const postData = this.getPostData()
        const data = await this.renderChartToPng(postData);
        return Buffer.from(data, 'binary');
    }

    async toDataUrl() {
        let buf = ''
        if(this.isRemote){
            buf = await this.toBinaryRemote();
        }
        else{
            buf = await this.toBinary();
        }
        const b64buf = buf.toString('base64');
        return `data:image/png;base64,${b64buf}`;
    }



    async toFile(pathOrDescriptor) {
        let buf = ''
        if(this.isRemote){
            buf = await this.toBinaryRemote();
        }
        else{
            buf = await this.toBinary();
        }
        fs.writeFileSync(pathOrDescriptor, buf);
    }
}

module.exports = QuickChartJs;