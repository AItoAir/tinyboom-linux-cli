# TinyBoom Linux CLI

* [日本語（Japanese）](#README(日本語))
* [English](#README-in-English)
-----

## README(日本語)
このCLIはLinux OSで動作するエッジデバイスのセンサーデータをTinyboomで収集するためのライブラリです。Node.jsで動作します。
このライブラリを使うためには、Tinyboom上でデバイス通信用のAPIを発行する必要があります。
Edgeimpulse社のLinux CLI（[edge-impulse-linux-cli](https://github.com/edgeimpulse/edge-impulse-linux-cli)）をもとに、Tinyboom CLIを作成しました。Edgeimpulse社に感謝申し上げます。
## データ収集
データを集めるのは、機械学習の第1ステップです。Linuxベースのエッジデバイスであれば、ホンCLIを使い、カメラセンサーからのデータ収集ができます。
## APIキー登録および生成
1. まだTinyboomにアカウント登録をお済でない方は、こちらのリンク（ [tinyboom.aitoair.com](https://tinyboom.aitoair.com/signup) ）でアカウント登録を行ってください。
2. 既存のプロジェクトがあれば、Detailボタンを、プロジェクトが無ければ、新しいプロジェクトを生成してください。
3. 左側の操作パンネルで`API Keys and Devices`を押すと、該当プロジェクトと関連しているエッジデバイスとAPIキーを確認することができます。
4. `API Keys`セクションで、`Generate`ボタンを押すと、`API Key`を発行することができます。`TinyBoom CLI`に使うAPIキーとなるため、大切に扱いましょう。
## Tinyboom CLIのセットアップ
このレポジトリを下記のコマンドでダウンロードします。
```
$ git clone https://github.com/AItoAir/tinyboom-linux-cli.git
```
CLIを使用するための必要ライブラリnodeとnpmをダウンロードした後、下記のコマンドでTinyboom CLIをインストールします。(Node v15.11.0とnpm v7.6.0でテスト済み)
```
$ cd aitoair-linux-cli-v2/
$ npm install
```
下記のコマンドでCLIを実行します。
```
$ node aitoair-cli --project PROJECT_CODE --api-key PROJECT_API_KEY
```
- `PROJECT_CODE`は自分のプロジェクト番号を記載してください。
- `PROJECT_API_KEY`は[APIキー登録および生成](#APIキー登録および生成)で生成したAPIキーを記載してください。

「サンプル」
```
$ node aitoair-cli --project P000000003 --api-key 38b9647b-f081-44a0-850a-3bb6b7056f2a
```
## カメラセンサーの観察
1. プロジェクトに戻り、`Data Collection`の`Upload from edge device`ボタンを押すと、プロジェクトと通信しているエッジデバイスのセンサーから送られているデータを確認することができます。
2. `Capture Train Image`や`Capture Test Image`ボタンで機械学習のためのデータを取得することができます。
-----

## README in English
This library lets you collect sensor data on Linux machines using Node.js.
This library interacts with our API with the use of API key available when you sign up and subscribe to our service.

This library is based from [edge-impulse-linux-cli](https://github.com/edgeimpulse/edge-impulse-linux-cli)

## Collecting data
Collecting data is one of the first step to training a machine learning model. If you want to collect data from your Linux edge device's camera, you can use our TinyBoom CLI application.

## Registration and Generating API Keys
1. If you have not yet signed up for an account, go to [tinyboom.aitoair.com](https://tinyboom.aitoair.com/signup) to register for a new account.
2. Select a project by clicking the `Detail` button or create a new project by clicking the `New Project` button.
3. From the left sidepanel, click `API Keys and Devices`. This will load a page where you can see the list of edge devices and api keys related to the project.
4. On the `API Keys` section, click the `Generate` button. This will generate and display a new `API Key` that you will use for connecting `TinyBoom CLI` app to the project.

## Setup and running TinyBoom CLI app
You can clone the repository using this command
```
$ git clone https://github.com/AItoAir/tinyboom-linux-cli.git
```

Next, install the dependencies. (Tested using Node version 15.11.0 and npm version 7.6.0)
```
$ cd aitoair-linux-cli-v2/
$ npm install
```
Launch the TinyBoom CLI app using this format
```
$ node aitoair-cli --project PROJECT_CODE --api-key PROJECT_API_KEY
```
- Replace `PROJECT_CODE` with the actual project code of your project
- Replace `PROJECT_API_KEY` with the api key you generated earlier from the TinyBoom web application.

Sample Usage
```
$ node aitoair-cli --project P000000003 --api-key 38b9647b-f081-44a0-850a-3bb6b7056f2a
```

## Viewing the camera feed from TinyBoom webapp
1. Go back to the TinyBoom web application.
2. Select the project which you have connected to your edge device by clicking the `Detail` button. You should now be redirected to the `Data Collection` page.
3. Click the `Upload from edge device` button. This will open the `Edge Device Image` modal and you can now see the camera feed of your edge device.
4. You can now click either `Capture Train Image` or `Capture Test Image` buttons to use the captured image as training or testing image for your machine learning project.

## Have any question or suggestion?
Feel free to [contact us](https://aitoair.com/contact-us/)