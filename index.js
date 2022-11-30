"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tgsnake_1 = require("tgsnake");
const step_1 = require("@tgsnake/step");
const mongoose_1 = __importDefault(require("mongoose"));
// models
const payModel_1 = __importDefault(require("./model/payModel"));
const coinModel_1 = __importDefault(require("./model/coinModel"));
const userModel_1 = __importDefault(require("./model/userModel"));
const investmentModel_1 = __importDefault(require("./model/investmentModel"));
const notificationModel_1 = __importDefault(require("./model/notificationModel"));
const withdrawModel_1 = __importDefault(require("./model/withdrawModel"));
const planModel_1 = __importDefault(require("./model/planModel"));
const adminConfigModel_1 = __importDefault(require("./model/adminConfigModel"));
const headerModel_1 = __importDefault(require("./model/headerModel"));
process.env.TZ = "Asia/Dubai";
mongoose_1.default
    .connect("mongodb://127.0.0.1:27017/poolin")
    .then(() => {
    console.log("connected to database");
})
    .catch((err) => {
    console.log(err);
});
const run = async () => {
    if (!(await adminConfigModel_1.default.findOne({}))) {
        const conf = new adminConfigModel_1.default({
            wallets: [],
        });
        await conf.save();
    }
};
run();
const bot = new tgsnake_1.Snake({
    apiHash: "3b2f8fccb6c128e81892af6367db5d3d",
    apiId: 14170274,
    botToken:"5629822020:AAE7Xla8fqoqtMkqnMff-rJSd_BmlDYAdSc",
});
const step = new step_1.Step({
    defaultMessage: "دستور ارسالی نامفهوم بود لطفا از عملیات و یا دکمه هایی تعیین شده استفاده کنید. در صورت لزوم به بازگشت از /start استفاده کنید",
});
async function start(ctx) {
    await ctx.reply("باسلام ادمین گرامی برای کار با ربات لطفا از دکمه های زیر استفاده نمایید", {
        replyMarkup: {
            keyboard: [
                ["پرداخت‌ها", "برداشت‌ها"],
                ["کاربران"],
                ["پلن‌ها"],
                ["ارز‌ها"],
                ["هدر‌ها", "ولت‌ها"],
                ["نوتفیکیشن‌ها"]
            ],
            resizeKeyboard: true,
        },
    });
}
const action = (text) => {
    text = text.slice(1);
    const [action, value] = text.split("@");
    return [action, value];
};
const action2 = (text) => {
    text = text.slice(1);
    const [action, value] = text.split("@ngeTo");
    return [action, value];
};
// --- functions
var fun;
(function (fun) {
    fun.pay = async (ctx) => {
        const [command, value] = action(ctx.text);
        if (command === "ok") {
            const pay = await payModel_1.default.findById(value);
            const user = await userModel_1.default.findById(pay.user);
            const coin = await coinModel_1.default.findById(pay.coin);
            // @ts-ignore
            const refValue = pay.value * coin.balance;
            if (user?.ref1 !== false) {
                const ref1 = await userModel_1.default.findById(user.ref1);
                if (ref1) {
                    await userModel_1.default.updateOne({ _id: ref1._id }, { profit1: refValue + ref1.profit1 });
                }
            }
            if (user?.ref2 !== false) {
                const ref2 = await userModel_1.default.findById(user.ref2);
                if (ref2) {
                    await userModel_1.default.updateOne({ _id: ref2._id }, { profit2: refValue + ref2.profit2 });
                }
            }
            const inv = new investmentModel_1.default({
                user: pay?.user,
                plan: pay?.plan,
                balance: pay?.value,
                coin: pay?.coin,
            });
            const not = new notificationModel_1.default({
                name: "Confirmation of payment",
                message: "The payment you made was approved by the admin",
                to: pay.user,
            });
            await payModel_1.default.deleteOne({ _id: pay._id });
            await inv.save();
            await not.save();
            await ctx.reply("پرداخت با موفقیت تایید شد");
        }
        else if (command === "no") {
            const pay = await payModel_1.default.findById(value);
            const not = new notificationModel_1.default({
                name: "Payment not approved",
                message: "Your payment was rejected by the admin",
                // @ts-ignore
                to: pay.user,
            });
            await payModel_1.default.deleteOne({ _id: pay._id });
            await not.save();
            await ctx.reply("پرداخت با موفقیت رد تایید شد");
        }
        else if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
        }
    };
    fun.withh = async (ctx) => {
        const [command, value] = action(ctx.text);
        if (command === "ok") {
            const draw = await withdrawModel_1.default.findById(value);
            const user = await userModel_1.default.findById(draw.user);
            const coin = await coinModel_1.default.findById(draw.coin);
            const not = new notificationModel_1.default({
                name: "Confirmation of withdraw",
                // @ts-ignore
                message: `${draw.value / coin.balance} ${coin.code} deposited into your wallet`,
                to: draw.user,
            });
            await not.save();
            await withdrawModel_1.default.deleteOne({ _id: draw._id });
            await ctx.reply("برداشت با موفقیت تایید شد.");
        }
        else if (command === "no") {
            const draw = await withdrawModel_1.default.findById(value);
            const not = new notificationModel_1.default({
                name: "withdraw not approved",
                message: "Your withdraw was rejected by the admin, and the balance was returned to your account.",
                // @ts-ignore
                to: draw.user,
            });
            await userModel_1.default.updateOne({ _id: draw?.user }, {
                $inc: {
                    balance: draw?.value,
                },
            });
            await withdrawModel_1.default.deleteOne({ _id: draw._id });
            await not.save();
            await ctx.reply("برداشت با موفقیت رد شد");
        }
        else if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
        }
    };
})(fun || (fun = {}));
var funcs;
(function (funcs) {
    // plans
    async function plan(ctx) {
        if (ctx.text === "لیست") {
            const plans = await planModel_1.default.find({});
            let string = "لیست پلن ها \n\n";
            for await (let v of plans) {
                string +=
                    "ایدی :‌ " +
                        v._id +
                        "\n عنوان : " +
                        v.title +
                        "\n توضیحات :‌ " +
                        v.description +
                        "\n زمان پلن :‌ " +
                        v.time +
                        "ماه" +
                        "\n سود پلن : " +
                        v.profit +
                        "\n حداقل سرمایه : " +
                        v.min +
                        " دلار" +
                        "\n حداکثر زمانه لغو : " +
                        v.cancelTime +
                        "\n--------------\n";
            }
            await ctx.reply(string);
        }
        else if (ctx.text === "حذف") {
            await ctx.reply("ایدی پلن را ارسال کنید", {
                replyMarkup: {
                    keyboard: [["بازگشت"]],
                    resizeKeyboard: true,
                },
            });
            step.setStep("payDelete");
        }
        else if (ctx.text === "افزودن") {
            await ctx.reply(`خب ادمین جان دقت بفرما برای اینکه پلن اضافه کنی باید یه سری داده بهم بدی که همگی باید با علامت '@' نشان گذاری بشن 
      من به این موارد نیاز دارم :‌
      ——————
      عنوان@
      توضیحات@
      سوده ماهانه(به درصد و عدد)@
      زمان سرمایه گذاری(به ماه و عدد)@
      حداقل مقدار سرمایه گذاری( به عدد و دلار)@
      حداکثر مدت زمان کنسلی( به ماه و عدد)@
      —————-
      
      نمونه ای از ارسال اطلاعات :‌
      Plan A@
      A Nice Plan@
      4@
      6@
      2000@
      3@`, {
                replyMarkup: {
                    keyboard: [["بازگشت"]],
                    resizeKeyboard: true,
                },
            });
            step.setStep("payAdd");
        }
        else if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
        }
    }
    funcs.plan = plan;
    async function payAdd(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        try {
            let text = ctx.text?.split("@");
            const pln = new planModel_1.default({
                title: text[0].trim(),
                description: text[1].trim(),
                profit: Number(text[2].trim()),
                time: Number(text[3].trim()),
                min: Number(text[4].trim()),
                cancelTime: Number(text[5].trim()),
            });
            await pln.save();
            await ctx.reply("پلن با موفقیت اضافه شد");
        }
        catch (err) {
            await ctx.reply("داش نشد دیگه این چیه ناموسا دادی، یه مشکلی داره، دقیقا ببین چی گفتم اونجوری بفرست. اه");
        }
    }
    funcs.payAdd = payAdd;
    async function payDelete(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        try {
            await planModel_1.default.deleteOne({ _id: ctx.text });
            await ctx.reply("پلن با موفقیت حذف شد");
        }
        catch (err) {
            await ctx.reply("این چی بود دیگه، گفتم ایدی");
        }
    }
    funcs.payDelete = payDelete;
    // -- coin
    async function coin(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        if (ctx.text === "لیست") {
            const coins = await coinModel_1.default.find({});
            let string = "لیست ارز ها \n\n";
            for await (let v of coins) {
                string +=
                    "ایدی :‌ " +
                        v._id +
                        "\n نام : " +
                        v.name +
                        "\n کد :‌ " +
                        v.code +
                        "\n ارزش دلاری :‌ " +
                        v.balance +
                        "\n--------------\n";
            }
            await ctx.reply(string);
        }
        else if (ctx.text === "حذف") {
            await ctx.reply("ایدی ارز را ارسال کنید", {
                replyMarkup: {
                    keyboard: [["بازگشت"]],
                    resizeKeyboard: true,
                },
            });
            step.setStep("coinDelete");
        }
        else if (ctx.text === "افزودن") {
            await ctx.reply(`خب ادمین جان دقت بفرما برای اینکه ارز اضافه کنی باید یه سری داده بهم بدی که همگی باید با علامت '@' نشان گذاری بشن 
      من به این موارد نیاز دارم :‌
      ——————
      عنوان@
      کد@
      ارزش دلاری ( به عدد و دلار)@
      —————-
      
      نمونه ای از ارسال اطلاعات :‌
      bitcoin@
      BTC@
      20000@`, {
                replyMarkup: {
                    keyboard: [["بازگشت"]],
                    resizeKeyboard: true,
                },
            });
            step.setStep("coinAdd");
        }
        else if (ctx.text === "بروزرسانی قیمت") {
            await ctx.reply(`خب ادمین جان دقت بفرما برای اینکه قیمت ارز رو به روز کنی باید یه سری داده بهم بدی که همگی باید با علامت '@' نشان گذاری بشن 
      من به این موارد نیاز دارم :‌
      ——————
      ایدی@
      قیمت دلاری ( به عدد و دلار)@
      —————-
      
      نمونه ای از ارسال اطلاعات :‌
      62f0e23461b4bf9fb6cd02b9@
      20000@`, {
                replyMarkup: {
                    keyboard: [["بازگشت"]],
                    resizeKeyboard: true,
                },
            });
            step.setStep("coinUpdate");
        }
    }
    funcs.coin = coin;
    async function coinDelete(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        try {
            await coinModel_1.default.deleteOne({ _id: ctx.text });
            await ctx.reply("ارز با موفقیت حذف شد");
        }
        catch (err) {
            await ctx.reply("این چی بود دیگه، گفتم ایدی");
        }
    }
    funcs.coinDelete = coinDelete;
    async function coinAdd(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        try {
            let text = ctx.text?.split("@");
            const con = new coinModel_1.default({
                name: text[0].trim(),
                code: text[1].trim(),
                balance: Number(text[2].trim()),
            });
            await con.save();
            await ctx.reply("ارز با موفقیت اضافه شد");
        }
        catch (err) {
            await ctx.reply("داش نشد دیگه این چیه ناموسا دادی، یه مشکلی داره، دقیقا ببین چی گفتم اونجوری بفرست. اه");
        }
    }
    funcs.coinAdd = coinAdd;
    async function coinUpdate(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        try {
            let text = ctx.text?.split("@");
            await coinModel_1.default.updateOne({ _id: text[0].trim() }, { balance: Number(text[1].trim()) });
            await ctx.reply("قیمت ارز با موفقیت به روز شد");
        }
        catch (err) {
            await ctx.reply("داش نشد دیگه این چیه ناموسا دادی، یه مشکلی داره، دقیقا ببین چی گفتم اونجوری بفرست. اه");
        }
    }
    funcs.coinUpdate = coinUpdate;
    // config
    async function config(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        if (ctx.text === "لیست") {
            const conf = await adminConfigModel_1.default.findOne({});
            let string = "لیست ولت ها \n\n";
            for await (let v of conf.wallets) {
                const coin = await coinModel_1.default.findById(v.coinId);
                string +=
                    "ایدی :‌ " +
                        v._id +
                        "\n ارز : " +
                        (coin?.name || "ارز وجود ندارد") +
                        "\n ادرس ولت :‌ " +
                        v.wallet +
                        "\n لینک کیوارکد :‌ " +
                        v.qrCode +
                        "\n--------------\n";
            }
            await ctx.reply(string, {
                noWebpage: true,
            });
        }
        else if (ctx.text === "حذف") {
            await ctx.reply("ایدی ولت را ارسال کنید", {
                replyMarkup: {
                    keyboard: [["بازگشت"]],
                    resizeKeyboard: true,
                },
            });
            step.setStep("configDelete");
        }
        else if (ctx.text === "افزودن") {
            await ctx.reply(`خب ادمین جان دقت بفرما برای اینکه ولت اضافه کنی باید یه سری داده بهم بدی که همگی باید با علامت '@' نشان گذاری بشن 
      من به این موارد نیاز دارم :‌
      ——————
      ایدی ارز مورد نظر@
      ادرس ولت@
      لینک تصویر کیوارکد@
      —————-
      
      نمونه ای از ارسال اطلاعات :‌
      62f13422b704f8a5ba99d681@
      asijdoaijdaijdjasdijasdjoqw@
      https://poolinvest.org/image.jpg@`, {
                replyMarkup: {
                    keyboard: [["بازگشت"]],
                    resizeKeyboard: true,
                },
            });
            step.setStep("configAdd");
        }
    }
    funcs.config = config;
    async function configDelete(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        try {
            await adminConfigModel_1.default.updateOne({}, {
                $pull: {
                    wallets: {
                        _id: ctx.text,
                    },
                },
            });
            await ctx.reply(".ولت با موفقیت حذف شد");
        }
        catch (err) {
            await ctx.reply("این چی بود دیگه، گفتم ایدی");
        }
    }
    funcs.configDelete = configDelete;
    async function configAdd(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        try {
            let text = ctx.text?.split("@");
            if (!(await coinModel_1.default.findById(text[0].trim())))
                return await ctx.reply("ارز مورد نظر اشتباهه");
            await adminConfigModel_1.default.updateOne({}, {
                $push: {
                    wallets: {
                        coinId: text[0].trim(),
                        wallet: text[1].trim(),
                        qrCode: text[2].trim(),
                    },
                },
            });
            await ctx.reply("ولت با موفقیت برای ارز مورد نظر اضافه شد");
        }
        catch (err) {
            await ctx.reply("داش نشد دیگه این چیه ناموسا دادی، یه مشکلی داره، دقیقا ببین چی گفتم اونجوری بفرست. اه");
        }
    }
    funcs.configAdd = configAdd;
    // header
    async function header(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        if (ctx.text === "لیست") {
            const hed = await headerModel_1.default.find({});
            let string = "لیست هدر ها \n\n";
            for await (let v of hed) {
                string +=
                    "ایدی :‌ " +
                        v._id +
                        "\n عنوان :‌ " +
                        v.title +
                        "\n توضیحات :‌ " +
                        v.description +
                        "\n لینک :‌ " +
                        v.link +
                        "\n--------------\n";
            }
            await ctx.reply(string, {
                noWebpage: true,
            });
        }
        else if (ctx.text === "حذف") {
            await ctx.reply("ایدی هدر را ارسال کنید", {
                replyMarkup: {
                    keyboard: [["بازگشت"]],
                    resizeKeyboard: true,
                },
            });
            step.setStep("headerDelete");
        }
        else if (ctx.text === "افزودن") {
            await ctx.reply(`خب ادمین جان دقت بفرما برای اینکه هدر اضافه کنی باید یه سری داده بهم بدی که همگی باید با علامت '@' نشان گذاری بشن 
      من به این موارد نیاز دارم :‌
      ——————
      عنوان@
      توضیحات@
      لینک@
      —————-
      
      نمونه ای از ارسال اطلاعات :‌
      first header@
      the best header@
      https://poolinvest.org/@`, {
                replyMarkup: {
                    keyboard: [["بازگشت"]],
                    resizeKeyboard: true,
                },
            });
            step.setStep("headerAdd");
        }
    }
    funcs.header = header;
    async function headerDelete(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        try {
            await headerModel_1.default.deleteOne({ _id: ctx.text });
            await ctx.reply(".هدر با موفقیت حذف شد");
        }
        catch (err) {
            await ctx.reply("این چی بود دیگه، گفتم ایدی");
        }
    }
    funcs.headerDelete = headerDelete;
    async function headerAdd(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        try {
            let text = ctx.text?.split("@");
            const head = new headerModel_1.default({
                title: text[0],
                description: text[1],
                link: text[2],
                image: "n",
            });
            await head.save();
            await ctx.reply("هدر با موفقیت اضافه شد");
        }
        catch (err) {
            await ctx.reply("داش نشد دیگه این چیه ناموسا دادی، یه مشکلی داره، دقیقا ببین چی گفتم اونجوری بفرست. اه");
        }
    }
    funcs.headerAdd = headerAdd;
    // user
    async function user(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        if (ctx.text === "لیست") {
            const usr = await userModel_1.default.find({}).limit(8);
            let string = "لیست کابر ها \n\n";
            for await (let v of usr) {
                string +=
                    "ایدی :‌ " +
                        v._id +
                        "\n نام :‌ " +
                        v.name +
                        "\n موجودی :‌ " +
                        v.balance +
                        "\n ایمیل :‌ " +
                        v.email +
                        "\n شماره تماس :‌ " +
                        v.phone +
                        "\n--------------\n";
            }
            string += "/ch@ngeTo" + 8;
            await ctx.reply(string, {
                noWebpage: true,
                replyMarkup: {
                    resizeKeyboard: true,
                    keyboard: [["بازگشت"]],
                },
            });
            step.setStep("userList");
        }
        else if (ctx.text === "حذف") {
            await ctx.reply("ایدی کاربر را ارسال کنید", {
                replyMarkup: {
                    keyboard: [["بازگشت"]],
                    resizeKeyboard: true,
                },
            });
            step.setStep("userDelete");
        }
        else if (ctx.text === "تغییر موجودی") {
            await ctx.reply(`خب ادمین جان دقت بفرما برای اینکه موجوی یه فرد رو تغییر بدی باید یه سری داده بهم بدی که همگی باید با علامت '@' نشان گذاری بشن 
      من به این موارد نیاز دارم :‌
      ——————
      ایدی@
      موجودی دلاری ( به عدد و دلار)@
      —————-
      
      نمونه ای از ارسال اطلاعات :‌
      62f0e23461b4bf9fb6cd02b9@
      20000@`, {
                replyMarkup: {
                    keyboard: [["بازگشت"]],
                    resizeKeyboard: true,
                },
            });
            step.setStep("userBalance");
        }
        else if (ctx.text === "جستجو با ایدی") {
            await ctx.reply("ایدی کاربر را ارسال کنید", {
                replyMarkup: {
                    keyboard: [["بازگشت"]],
                    resizeKeyboard: true,
                },
            });
            step.setStep("userFindById");
        }
        else if (ctx.text === "جستجو با ایمیل") {
            await ctx.reply("ایمیل کاربر را ارسال کنید", {
                replyMarkup: {
                    keyboard: [["بازگشت"]],
                    resizeKeyboard: true,
                },
            });
            step.setStep("userFindByEmail");
        }
    }
    funcs.user = user;
    async function userList(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        let [command, value] = action2(ctx.text);
        if (command === "ch") {
            const usr = await userModel_1.default.find({}).skip(Number(value)).limit(8);
            let string = "لیست کاربر ها \n\n";
            for await (let v of usr) {
                string +=
                    "ایدی :‌ " +
                        v._id +
                        "\n نام :‌ " +
                        v.name +
                        "\n موجودی :‌ " +
                        v.balance +
                        "\n ایمیل :‌ " +
                        v.email +
                        "\n شماره تماس :‌ " +
                        v.phone +
                        "\n--------------\n";
            }
            string += "/ch@ngeTo" + (Number(value) + 8);
            if (Number(value) !== 0) {
                string += "\n/ch@ngeTo" + (Number(value) - 8);
            }
            await ctx.reply(string, {
                noWebpage: true,
            });
        }
    }
    funcs.userList = userList;
    async function userBalance(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        try {
            let text = ctx.text?.split("@");
            await userModel_1.default.updateOne({ _id: text[0].trim() }, { balance: Number(text[1].trim()) });
            await ctx.reply("موجودی کاربر مورد نظر با موفقیت تغییر کرد");
        }
        catch (err) {
            await ctx.reply("داش نشد دیگه این چیه ناموسا دادی، یه مشکلی داره، دقیقا ببین چی گفتم اونجوری بفرست. اه");
        }
    }
    funcs.userBalance = userBalance;
    async function userDelete(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        try {
            await userModel_1.default.deleteOne({ _id: ctx.text });
            await ctx.reply(".کاربر با موفقیت حذف شد");
        }
        catch (err) {
            await ctx.reply("این چی بود دیگه، گفتم ایدی");
        }
    }
    funcs.userDelete = userDelete;
    async function userFindByEmail(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        try {
            const user = await userModel_1.default.findOne({ email: ctx.text });
            if (!user) {
                return await ctx.reply("کاربری با این ایمیل یافت نشد");
            }
            await ctx.reply("کاربر یافت شد :‌ \n\n" +
                "ایدی :‌ " +
                user._id +
                "\n نام :‌ " +
                user.name +
                "\n موجودی :‌ " +
                user.balance +
                "\n ایمیل :‌ " +
                user.email +
                "\n شماره تماس :‌ " +
                user.phone, { noWebpage: true });
        }
        catch (err) {
            await ctx.reply("این چی بود دیگه، گفتم ایدی");
        }
    }
    funcs.userFindByEmail = userFindByEmail;
    async function userFindById(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        try {
            const user = await userModel_1.default.findOne({ _id: ctx.text });
            if (!user) {
                return await ctx.reply("کاربری با این ایدی یافت نشد");
            }
            await ctx.reply("کاربر یافت شد :‌ \n\n" +
                "ایدی :‌ " +
                user._id +
                "\n نام :‌ " +
                user.name +
                "\n موجودی :‌ " +
                user.balance +
                "\n ایمیل :‌ " +
                user.email +
                "\n شماره تماس :‌ " +
                user.phone, { noWebpage: true });
        }
        catch (err) {
            await ctx.reply("این چی بود دیگه، گفتم ایدی");
        }
    }
    funcs.userFindById = userFindById;
    async function notification(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        if (ctx.text === "نوتفیکیشن به همه") {
            await ctx.reply(`خب ادمین جان دقت بفرما برای اینکه به همه نوتفیکیشن بدی نیازه که یه سری داده بهم بدی که همگی باید با علامت '@' نشان گذاری بشن 
      من به این موارد نیاز دارم :‌
      ——————
      عنوان نوتفیکیشن@
      پیغام@
      —————-
      
      نمونه ای از ارسال اطلاعات :‌
      the best notif@
      very very nice notification@`, {
                replyMarkup: {
                    keyboard: [["بازگشت"]],
                    resizeKeyboard: true,
                },
            });
            step.setStep("notificationAll");
        }
        else if (ctx.text === "نوتیفیکشن به یک کاربر") {
            await ctx.reply(`خب ادمین جان دقت بفرما برای اینکه به یک کاربر نوتفیکیشن بدی نیازه که یه سری داده بهم بدی که همگی باید با علامت '@' نشان گذاری بشن 
      من به این موارد نیاز دارم :‌
      ——————
      عنوان نوتفیکیشن@
      پیغام@
      ایدی کاربر@
      —————-
      
      نمونه ای از ارسال اطلاعات :‌
      the best notif@
      very very nice notification@
      62f4a8c8f0a9ca32852a8ea3@
      `, {
                replyMarkup: {
                    keyboard: [["بازگشت"]],
                    resizeKeyboard: true,
                },
            });
            step.setStep("notificationUser");
        }
        else if (ctx.text === "پاکسازی نوتفیکیشن ها") {
            await ctx.reply("از انجام این عملیات مطمئن هستید؟ تمامی داده های مربوط به نوتفیکیشن ها از سرور پاک میشون.", {
                replyMarkup: {
                    resizeKeyboard: true,
                    keyboard: [["بله"], ["بازگشت"]],
                },
            });
            step.setStep("notificationClear");
        }
    }
    funcs.notification = notification;
    async function notificationAll(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        try {
            let text = ctx.text?.split("@");
            const notf = new notificationModel_1.default({
                name: text[0].trim(),
                message: text[1].trim(),
                to: "62ee26273d6e1a3100df86fe",
                all: true,
            });
            await notf.save();
            await ctx.reply("نوتفیکیشن با موفقیت به تمامی کاربران ارسال شد");
        }
        catch (err) {
            await ctx.reply("داش نشد دیگه این چیه ناموسا دادی، یه مشکلی داره، دقیقا ببین چی گفتم اونجوری بفرست. اه");
        }
    }
    funcs.notificationAll = notificationAll;
    async function notificationUser(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        try {
            let text = ctx.text?.split("@");
            const notf = new notificationModel_1.default({
                name: text[0].trim(),
                message: text[1].trim(),
                to: text[2].trim(),
            });
            await notf.save();
            await ctx.reply("نوتفیکیشن با موفقیت به کاربر ارسال شد");
        }
        catch (err) {
            await ctx.reply("داش نشد دیگه این چیه ناموسا دادی، یه مشکلی داره، دقیقا ببین چی گفتم اونجوری بفرست. اه");
        }
    }
    funcs.notificationUser = notificationUser;
    async function notificationClear(ctx) {
        if (ctx.text === "بازگشت") {
            await start(ctx);
            step.setStep("main");
            return;
        }
        if (ctx.text === "بله") {
            await notificationModel_1.default.deleteMany({});
            await ctx.reply("نوتفیکیشن‌ها با موفقیت پاکسازی شدن");
        }
    }
    funcs.notificationClear = notificationClear;
})(funcs || (funcs = {}));
async function main(ctx) {
    if (ctx.text === "پرداخت‌ها") {
        const pays = await payModel_1.default.find({}).limit(8);
        let string = "لیست درخواست های پرداخت \n\n";
        for await (let v of pays) {
            const coin = await coinModel_1.default.findById(v.coin);
            const time = new Date(v.timestamp);
            string +=
                "کاربر :‌ " +
                    v.user +
                    "\n ارز : " +
                    coin?.name +
                    "\n مقدار :‌ " +
                    v.value +
                    "\n لینک پرداخت : " +
                    v.link +
                    "\n توضیحات کاربر :‌ " +
                    v.description +
                    "\n زمان درخواست : \n" +
                    `${time.getFullYear()} / ${time.getMonth()} / ${time.getDate()} - ${time.getHours()}:${time.getMinutes()} \n` +
                    "عملیات ها : \n" +
                    `/ok@${v._id}\n` +
                    `/no@${v._id}\n` +
                    "\n--------------\n";
        }
        await ctx.reply(string, {
            replyMarkup: {
                resizeKeyboard: true,
                keyboard: [["بازگشت"]],
            },
        });
        step.setStep("pay");
    }
    else if (ctx.text === "برداشت‌ها") {
        const withs = await withdrawModel_1.default.find({}).limit(8);
        let string = "لیست درخواست های برداشت \n\n";
        for await (let v of withs) {
            const coin = await coinModel_1.default.findById(v.coin);
            const time = new Date(v.timestamp);
            string +=
                "کاربر :‌ " +
                    v.user +
                    "\n مبلغ :‌ " +
                    v.value +
                    "\n ارز : " +
                    coin?.name +
                    "\n ادرس ولت : " +
                    v.wallet +
                    "\n توضیحات کاربر :‌ " +
                    v.description +
                    "\n زمان درخواست : \n" +
                    `${time.getFullYear()} / ${time.getMonth()} / ${time.getDate()} - ${time.getHours()}:${time.getMinutes()} \n` +
                    "عملیات ها : \n" +
                    `/ok@${v._id}\n` +
                    `/no@${v._id}\n` +
                    "\n--------------\n";
        }
        await ctx.reply(string, {
            replyMarkup: {
                resizeKeyboard: true,
                keyboard: [["بازگشت"]],
            },
        });
        step.setStep("with");
    }
    else if (ctx.text === "پلن‌ها") {
        await ctx.reply("برای ادامه یکی از گزینه هارا انتخاب کنید", {
            replyMarkup: {
                resizeKeyboard: true,
                keyboard: [["لیست"], ["افزودن", "حذف"], ["بازگشت"]],
            },
        });
        step.setStep("plan");
    }
    else if (ctx.text === "ارز‌ها") {
        await ctx.reply("برای ادامه یکی از گزینه هارا انتخاب کنید", {
            replyMarkup: {
                resizeKeyboard: true,
                keyboard: [["لیست"], ["افزودن", "حذف"], ["بروزرسانی قیمت"], ["بازگشت"]],
            },
        });
        step.setStep("coin");
    }
    else if (ctx.text === "ولت‌ها") {
        await ctx.reply("برای ادامه یکی از گزینه هارا انتخاب کنید", {
            replyMarkup: {
                resizeKeyboard: true,
                keyboard: [["لیست"], ["افزودن", "حذف"], ["بازگشت"]],
            },
        });
        step.setStep("config");
    }
    else if (ctx.text === "هدر‌ها") {
        await ctx.reply("برای ادامه یکی از گزینه هارا انتخاب کنید", {
            replyMarkup: {
                resizeKeyboard: true,
                keyboard: [["لیست"], ["افزودن", "حذف"], ["بازگشت"]],
            },
        });
        step.setStep("header");
    }
    else if (ctx.text === "کاربران") {
        await ctx.reply("برای ادامه یکی از گزینه هارا انتخاب کنید", {
            replyMarkup: {
                resizeKeyboard: true,
                keyboard: [
                    ["لیست"],
                    ["حذف"],
                    ["تغییر موجودی"],
                    ["جستجو با ایدی"],
                    ["جستجو با ایمیل"],
                    ["بازگشت"],
                ],
            },
        });
        step.setStep("user");
    }
    else if (ctx.text === "نوتفیکیشن‌ها") {
        await ctx.reply("برای ادامه یکی از گزینه هارا انتخاب کنید", {
            replyMarkup: {
                resizeKeyboard: true,
                keyboard: [["نوتفیکیشن به همه"], ["نوتیفیکشن به یک کاربر"], ["پاکسازی نوتفیکیشن ها"]],
            },
        });
        step.setStep("notification");
    }
}
// ---
const admins = [5632820532n,5349562729n];
bot.on("message", (ctx) => {
    if (!admins.includes(ctx.from.id))
        return;
    step
        .set(ctx)
        .start("main", async () => {
        await start(ctx);
    })
        .step("main", async () => {
        await main(ctx);
    })
        .step("pay", async () => {
        await fun.pay(ctx);
    })
        .step("with", async () => {
        await fun.withh(ctx);
    })
        .step("plan", async () => {
        await funcs.plan(ctx);
    })
        .step("payDelete", async () => {
        await funcs.payDelete(ctx);
    })
        .step("payAdd", async () => {
        await funcs.payAdd(ctx);
    })
        .step("coin", async () => {
        await funcs.coin(ctx);
    })
        .step("coinDelete", async () => {
        await funcs.coinDelete(ctx);
    })
        .step("coinAdd", async () => {
        await funcs.coinAdd(ctx);
    })
        .step("coinUpdate", async () => {
        await funcs.coinUpdate(ctx);
    })
        .step("config", async () => {
        await funcs.config(ctx);
    })
        .step("configDelete", async () => {
        await funcs.configDelete(ctx);
    })
        .step("configAdd", async () => {
        await funcs.configAdd(ctx);
    })
        .step("header", async () => {
        await funcs.header(ctx);
    })
        .step("headerDelete", async () => {
        await funcs.headerDelete(ctx);
    })
        .step("headerAdd", async () => {
        await funcs.headerAdd(ctx);
    })
        .step("user", async () => {
        await funcs.user(ctx);
    })
        .step("userList", async () => {
        await funcs.userList(ctx);
    })
        .step("userDelete", async () => {
        await funcs.userDelete(ctx);
    })
        .step("userBalance", async () => {
        await funcs.userBalance(ctx);
    })
        .step("userFindById", async () => {
        await funcs.userFindById(ctx);
    })
        .step("userFindByEmail", async () => {
        await funcs.userFindByEmail(ctx);
    })
        .step("notification", async () => {
        await funcs.notification(ctx);
    })
        .step("notificationAll", async () => {
        await funcs.notificationAll(ctx);
    })
        .step("notificationUser", async () => {
        await funcs.notificationUser(ctx);
    })
        .step("notificationClear", async () => {
        await funcs.notificationClear(ctx);
    })
        .end();
});
bot.run();
