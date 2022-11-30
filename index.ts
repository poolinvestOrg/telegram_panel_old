import { Snake } from "tgsnake";
import { Combine, MessageContext } from "tgsnake/lib/Context";
import { Step } from "@tgsnake/step";
import mongoose from "mongoose";

// models
import PayModel from "./model/payModel";
import CoinModel from "./model/coinModel";
import UserModel from "./model/userModel";
import InvestmentModel from "./model/investmentModel";
import NotificationModel from "./model/notificationModel";
import WithdrawModel from "./model/withdrawModel";
import PlanModel from "./model/planModel";
import AdminConfigModel from "./model/adminConfigModel";
import HeaderModel from "./model/headerModel";
process.env.TZ = "Asia/Dubai";
mongoose
  .connect("mongodb://127.0.0.1:27017/poolin")
  .then(() => {
    console.log("connected to database");
  })
  .catch((err) => {
    console.log(err);
  });

const run = async () => {
  if (!(await AdminConfigModel.findOne({}))) {
    const conf = new AdminConfigModel({
      wallets: [],
    });
    await conf.save();
  }
};

run();

type update = Combine<MessageContext, {}>;

const bot = new Snake({
  apiHash: "840e20c7fc0998b976d242a108d68784",
  apiId: 16946914,
  botToken: "5465663855:AAGMVhc7_CggRcQzsJf3_S71oRGhkezBQb0",
});

const step = new Step({
  defaultMessage:
    "دستور ارسالی نامفهوم بود لطفا از عملیات و یا دکمه هایی تعیین شده استفاده کنید. در صورت لزوم به بازگشت از /start استفاده کنید",
});

async function start(ctx: update) {
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

const action = (text: string) => {
  text = text.slice(1);
  const [action, value] = text.split("@");
  return [action, value];
};

const action2 = (text: string) => {
  text = text.slice(1);
  const [action, value] = text.split("@ngeTo");
  return [action, value];
};

// --- functions
let userValue;
namespace fun {
  export const pay = async (ctx: update) => {
    const [command, value] = action(ctx.text!);
    if (command === "ok") {
      userValue = value;
      await ctx.reply("ایا نیازی به ارسال لینک هست؟",{
        replyMarkup : {
          resizeKeyboard : true,
          keyboard : [
            ["خیر", "بله"],
            ["بازگشت"]
          ]
        }
      });
      step.setStep("paySend")
    } else if (command === "no") {
      const pay = await PayModel.findById(value);
      const not = new NotificationModel({
        name: "Payment not approved",
        message: "Your payment was rejected by the admin",
        // @ts-ignore
        to: pay.user,
      });
      await PayModel.deleteOne({ _id: pay!._id });
      await not.save();
      await ctx.reply("پرداخت با موفقیت رد تایید شد");
    } else if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
    }
  };
  export async function paySend(ctx: update){
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }

    if(ctx.text === "بله"){

    }else if(ctx.text === "خیر"){
      const pay = await PayModel.findById(userValue as any);
      const user = await UserModel.findById(pay!.user);
      const coin = await CoinModel.findById(pay!.coin);
      // @ts-ignore
      const refValue = pay.value * coin!.balance;
      if (user?.ref1 !== false) {
        const ref1 = await UserModel.findById(user!.ref1);
        if (ref1) {
          await UserModel.updateOne({ _id: ref1._id }, { profit1: refValue + ref1.profit1 });
        }
      }
      if (user?.ref2 !== false) {
        const ref2 = await UserModel.findById(user!.ref2);
        if (ref2) {
          await UserModel.updateOne({ _id: ref2._id }, { profit2: refValue + ref2.profit2 });
        }
      }
      const inv = new InvestmentModel({
        user: pay?.user,
        plan: pay?.plan,
        balance: pay?.value,
        coin: pay?.coin,
      });
      const not = new NotificationModel({
        name: "Confirmation of payment",
        message: "The payment you made was approved by the admin",
        to: pay!.user,
      });
      await PayModel.deleteOne({ _id: pay!._id });
      await inv.save();
      await not.save();
    }
  }
  export const withh = async (ctx: update) => {
    const [command, value] = action(ctx.text!);
    if (command === "ok") {
      const draw = await WithdrawModel.findById(value);
      const user = await UserModel.findById(draw!.user);
      const coin = await CoinModel.findById(draw!.coin);
      const not = new NotificationModel({
        name: "Confirmation of withdraw",
        // @ts-ignore
        message: `${draw.value / coin.balance} ${coin.code} deposited into your wallet`,
        to: draw!.user,
      });
      await not.save();
      await WithdrawModel.deleteOne({ _id: draw!._id });
      await ctx.reply("برداشت با موفقیت تایید شد.");
    } else if (command === "no") {
      const draw = await WithdrawModel.findById(value);
      const not = new NotificationModel({
        name: "withdraw not approved",
        message:
          "Your withdraw was rejected by the admin, and the balance was returned to your account.",
        // @ts-ignore
        to: draw.user,
      });
      await UserModel.updateOne(
        { _id: draw?.user },
        {
          $inc: {
            balance: draw?.value,
          },
        }
      );
      await WithdrawModel.deleteOne({ _id: draw!._id });
      await not.save();
      await ctx.reply("برداشت با موفقیت رد شد");
    } else if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
    }
  };
}

namespace funcs {
  // plans
  export async function plan(ctx: update) {
    if (ctx.text === "لیست") {
      const plans = await PlanModel.find({});
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
    } else if (ctx.text === "حذف") {
      await ctx.reply("ایدی پلن را ارسال کنید", {
        replyMarkup: {
          keyboard: [["بازگشت"]],
          resizeKeyboard: true,
        },
      });
      step.setStep("payDelete");
    } else if (ctx.text === "افزودن") {
      await ctx.reply(
        `خب ادمین جان دقت بفرما برای اینکه پلن اضافه کنی باید یه سری داده بهم بدی که همگی باید با علامت '@' نشان گذاری بشن 
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
      3@`,
        {
          replyMarkup: {
            keyboard: [["بازگشت"]],
            resizeKeyboard: true,
          },
        }
      );
      step.setStep("payAdd");
    } else if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
    }
  }
  export async function payAdd(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }
    try {
      let text: any = ctx.text?.split("@");
      const pln = new PlanModel({
        title: text[0].trim(),
        description: text[1].trim(),
        profit: Number(text[2].trim()),
        time: Number(text[3].trim()),
        min: Number(text[4].trim()),
        cancelTime: Number(text[5].trim()),
      });
      await pln.save();
      await ctx.reply("پلن با موفقیت اضافه شد");
    } catch (err) {
      await ctx.reply(
        "داش نشد دیگه این چیه ناموسا دادی، یه مشکلی داره، دقیقا ببین چی گفتم اونجوری بفرست. اه"
      );
    }
  }
  export async function payDelete(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }
    try {
      await PlanModel.deleteOne({ _id: ctx.text });
      await ctx.reply("پلن با موفقیت حذف شد");
    } catch (err) {
      await ctx.reply("این چی بود دیگه، گفتم ایدی");
    }
  }

  // -- coin
  export async function coin(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }

    if (ctx.text === "لیست") {
      const coins = await CoinModel.find({});
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
    } else if (ctx.text === "حذف") {
      await ctx.reply("ایدی ارز را ارسال کنید", {
        replyMarkup: {
          keyboard: [["بازگشت"]],
          resizeKeyboard: true,
        },
      });
      step.setStep("coinDelete");
    } else if (ctx.text === "افزودن") {
      await ctx.reply(
        `خب ادمین جان دقت بفرما برای اینکه ارز اضافه کنی باید یه سری داده بهم بدی که همگی باید با علامت '@' نشان گذاری بشن 
      من به این موارد نیاز دارم :‌
      ——————
      عنوان@
      کد@
      ارزش دلاری ( به عدد و دلار)@
      —————-
      
      نمونه ای از ارسال اطلاعات :‌
      bitcoin@
      BTC@
      20000@`,
        {
          replyMarkup: {
            keyboard: [["بازگشت"]],
            resizeKeyboard: true,
          },
        }
      );
      step.setStep("coinAdd");
    } else if (ctx.text === "بروزرسانی قیمت") {
      await ctx.reply(
        `خب ادمین جان دقت بفرما برای اینکه قیمت ارز رو به روز کنی باید یه سری داده بهم بدی که همگی باید با علامت '@' نشان گذاری بشن 
      من به این موارد نیاز دارم :‌
      ——————
      ایدی@
      قیمت دلاری ( به عدد و دلار)@
      —————-
      
      نمونه ای از ارسال اطلاعات :‌
      62f0e23461b4bf9fb6cd02b9@
      20000@`,
        {
          replyMarkup: {
            keyboard: [["بازگشت"]],
            resizeKeyboard: true,
          },
        }
      );
      step.setStep("coinUpdate");
    }
  }

  export async function coinDelete(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }
    try {
      await CoinModel.deleteOne({ _id: ctx.text });
      await ctx.reply("ارز با موفقیت حذف شد");
    } catch (err) {
      await ctx.reply("این چی بود دیگه، گفتم ایدی");
    }
  }

  export async function coinAdd(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }
    try {
      let text: any = ctx.text?.split("@");
      const con = new CoinModel({
        name: text[0].trim(),
        code: text[1].trim(),
        balance: Number(text[2].trim()),
      });
      await con.save();
      await ctx.reply("ارز با موفقیت اضافه شد");
    } catch (err) {
      await ctx.reply(
        "داش نشد دیگه این چیه ناموسا دادی، یه مشکلی داره، دقیقا ببین چی گفتم اونجوری بفرست. اه"
      );
    }
  }
  export async function coinUpdate(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }
    try {
      let text: any = ctx.text?.split("@");
      await CoinModel.updateOne({ _id: text[0].trim() }, { balance: Number(text[1].trim()) });
      await ctx.reply("قیمت ارز با موفقیت به روز شد");
    } catch (err) {
      await ctx.reply(
        "داش نشد دیگه این چیه ناموسا دادی، یه مشکلی داره، دقیقا ببین چی گفتم اونجوری بفرست. اه"
      );
    }
  }

  // config
  export async function config(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }

    if (ctx.text === "لیست") {
      const conf: any = await AdminConfigModel.findOne({});
      let string = "لیست ولت ها \n\n";
      for await (let v of conf.wallets) {
        const coin: any = await CoinModel.findById(v.coinId);
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
    } else if (ctx.text === "حذف") {
      await ctx.reply("ایدی ولت را ارسال کنید", {
        replyMarkup: {
          keyboard: [["بازگشت"]],
          resizeKeyboard: true,
        },
      });
      step.setStep("configDelete");
    } else if (ctx.text === "افزودن") {
      await ctx.reply(
        `خب ادمین جان دقت بفرما برای اینکه ولت اضافه کنی باید یه سری داده بهم بدی که همگی باید با علامت '@' نشان گذاری بشن 
      من به این موارد نیاز دارم :‌
      ——————
      ایدی ارز مورد نظر@
      ادرس ولت@
      لینک تصویر کیوارکد@
      —————-
      
      نمونه ای از ارسال اطلاعات :‌
      62f13422b704f8a5ba99d681@
      asijdoaijdaijdjasdijasdjoqw@
      https://poolinvest.org/image.jpg@`,
        {
          replyMarkup: {
            keyboard: [["بازگشت"]],
            resizeKeyboard: true,
          },
        }
      );
      step.setStep("configAdd");
    }
  }
  export async function configDelete(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }
    try {
      await AdminConfigModel.updateOne(
        {},
        {
          $pull: {
            wallets: {
              _id: ctx.text,
            },
          },
        }
      );
      await ctx.reply(".ولت با موفقیت حذف شد");
    } catch (err) {
      await ctx.reply("این چی بود دیگه، گفتم ایدی");
    }
  }

  export async function configAdd(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }
    try {
      let text: any = ctx.text?.split("@");
      if (!(await CoinModel.findById(text[0].trim())))
        return await ctx.reply("ارز مورد نظر اشتباهه");
      await AdminConfigModel.updateOne(
        {},
        {
          $push: {
            wallets: {
              coinId: text[0].trim(),
              wallet: text[1].trim(),
              qrCode: text[2].trim(),
            },
          },
        }
      );
      await ctx.reply("ولت با موفقیت برای ارز مورد نظر اضافه شد");
    } catch (err) {
      await ctx.reply(
        "داش نشد دیگه این چیه ناموسا دادی، یه مشکلی داره، دقیقا ببین چی گفتم اونجوری بفرست. اه"
      );
    }
  }

  // header

  export async function header(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }

    if (ctx.text === "لیست") {
      const hed: any = await HeaderModel.find({});
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
    } else if (ctx.text === "حذف") {
      await ctx.reply("ایدی هدر را ارسال کنید", {
        replyMarkup: {
          keyboard: [["بازگشت"]],
          resizeKeyboard: true,
        },
      });
      step.setStep("headerDelete");
    } else if (ctx.text === "افزودن") {
      await ctx.reply(
        `خب ادمین جان دقت بفرما برای اینکه هدر اضافه کنی باید یه سری داده بهم بدی که همگی باید با علامت '@' نشان گذاری بشن 
      من به این موارد نیاز دارم :‌
      ——————
      عنوان@
      توضیحات@
      لینک@
      —————-
      
      نمونه ای از ارسال اطلاعات :‌
      first header@
      the best header@
      https://poolinvest.org/@`,
        {
          replyMarkup: {
            keyboard: [["بازگشت"]],
            resizeKeyboard: true,
          },
        }
      );
      step.setStep("headerAdd");
    }
  }

  export async function headerDelete(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }
    try {
      await HeaderModel.deleteOne({ _id: ctx.text });
      await ctx.reply(".هدر با موفقیت حذف شد");
    } catch (err) {
      await ctx.reply("این چی بود دیگه، گفتم ایدی");
    }
  }

  export async function headerAdd(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }
    try {
      let text: any = ctx.text?.split("@");
      const head = new HeaderModel({
        title: text[0],
        description: text[1],
        link: text[2],
        image: "n",
      });
      await head.save();
      await ctx.reply("هدر با موفقیت اضافه شد");
    } catch (err) {
      await ctx.reply(
        "داش نشد دیگه این چیه ناموسا دادی، یه مشکلی داره، دقیقا ببین چی گفتم اونجوری بفرست. اه"
      );
    }
  }

  // user
  export async function user(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }

    if (ctx.text === "لیست") {
      const usr: any = await UserModel.find({}).limit(8);
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
    } else if (ctx.text === "حذف") {
      await ctx.reply("ایدی کاربر را ارسال کنید", {
        replyMarkup: {
          keyboard: [["بازگشت"]],
          resizeKeyboard: true,
        },
      });
      step.setStep("userDelete");
    } else if (ctx.text === "تغییر موجودی") {
      await ctx.reply(
        `خب ادمین جان دقت بفرما برای اینکه موجوی یه فرد رو تغییر بدی باید یه سری داده بهم بدی که همگی باید با علامت '@' نشان گذاری بشن 
      من به این موارد نیاز دارم :‌
      ——————
      ایدی@
      موجودی دلاری ( به عدد و دلار)@
      —————-
      
      نمونه ای از ارسال اطلاعات :‌
      62f0e23461b4bf9fb6cd02b9@
      20000@`,
        {
          replyMarkup: {
            keyboard: [["بازگشت"]],
            resizeKeyboard: true,
          },
        }
      );
      step.setStep("userBalance");
    } else if (ctx.text === "جستجو با ایدی") {
      await ctx.reply("ایدی کاربر را ارسال کنید", {
        replyMarkup: {
          keyboard: [["بازگشت"]],
          resizeKeyboard: true,
        },
      });
      step.setStep("userFindById");
    } else if (ctx.text === "جستجو با ایمیل") {
      await ctx.reply("ایمیل کاربر را ارسال کنید", {
        replyMarkup: {
          keyboard: [["بازگشت"]],
          resizeKeyboard: true,
        },
      });
      step.setStep("userFindByEmail");
    }
  }

  export async function userList(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }
    let [command, value] = action2(ctx.text as any);
    if (command === "ch") {
      const usr: any = await UserModel.find({}).skip(Number(value)).limit(8);
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

  export async function userBalance(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }
    try {
      let text: any = ctx.text?.split("@");
      await UserModel.updateOne({ _id: text[0].trim() }, { balance: Number(text[1].trim()) });
      await ctx.reply("موجودی کاربر مورد نظر با موفقیت تغییر کرد");
    } catch (err) {
      await ctx.reply(
        "داش نشد دیگه این چیه ناموسا دادی، یه مشکلی داره، دقیقا ببین چی گفتم اونجوری بفرست. اه"
      );
    }
  }

  export async function userDelete(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }
    try {
      await UserModel.deleteOne({ _id: ctx.text });
      await ctx.reply(".کاربر با موفقیت حذف شد");
    } catch (err) {
      await ctx.reply("این چی بود دیگه، گفتم ایدی");
    }
  }

  export async function userFindByEmail(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }
    try {
      const user = await UserModel.findOne({ email: ctx.text });
      if (!user) {
        return await ctx.reply("کاربری با این ایمیل یافت نشد");
      }
      await ctx.reply(
        "کاربر یافت شد :‌ \n\n" +
          "ایدی :‌ " +
          user._id +
          "\n نام :‌ " +
          user.name +
          "\n موجودی :‌ " +
          user.balance +
          "\n ایمیل :‌ " +
          user.email +
          "\n شماره تماس :‌ " +
          user.phone,
        { noWebpage: true }
      );
    } catch (err) {
      await ctx.reply("این چی بود دیگه، گفتم ایدی");
    }
  }

  export async function userFindById(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }
    try {
      const user = await UserModel.findOne({ _id: ctx.text });
      if (!user) {
        return await ctx.reply("کاربری با این ایدی یافت نشد");
      }
      await ctx.reply(
        "کاربر یافت شد :‌ \n\n" +
          "ایدی :‌ " +
          user._id +
          "\n نام :‌ " +
          user.name +
          "\n موجودی :‌ " +
          user.balance +
          "\n ایمیل :‌ " +
          user.email +
          "\n شماره تماس :‌ " +
          user.phone,
        { noWebpage: true }
      );
    } catch (err) {
      await ctx.reply("این چی بود دیگه، گفتم ایدی");
    }
  }

  export async function notification(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }

    if (ctx.text === "نوتفیکیشن به همه") {
      await ctx.reply(
        `خب ادمین جان دقت بفرما برای اینکه به همه نوتفیکیشن بدی نیازه که یه سری داده بهم بدی که همگی باید با علامت '@' نشان گذاری بشن 
      من به این موارد نیاز دارم :‌
      ——————
      عنوان نوتفیکیشن@
      پیغام@
      —————-
      
      نمونه ای از ارسال اطلاعات :‌
      the best notif@
      very very nice notification@`,
        {
          replyMarkup: {
            keyboard: [["بازگشت"]],
            resizeKeyboard: true,
          },
        }
      );
      step.setStep("notificationAll");
    } else if (ctx.text === "نوتیفیکشن به یک کاربر") {
      await ctx.reply(
        `خب ادمین جان دقت بفرما برای اینکه به یک کاربر نوتفیکیشن بدی نیازه که یه سری داده بهم بدی که همگی باید با علامت '@' نشان گذاری بشن 
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
      `,
        {
          replyMarkup: {
            keyboard: [["بازگشت"]],
            resizeKeyboard: true,
          },
        }
      );
      step.setStep("notificationUser");
    } else if (ctx.text === "پاکسازی نوتفیکیشن ها") {
      await ctx.reply(
        "از انجام این عملیات مطمئن هستید؟ تمامی داده های مربوط به نوتفیکیشن ها از سرور پاک میشون.",
        {
          replyMarkup: {
            resizeKeyboard: true,
            keyboard: [["بله"], ["بازگشت"]],
          },
        }
      );
      step.setStep("notificationClear");
    }
  }
  export async function notificationAll(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }
    try {
      let text: any = ctx.text?.split("@");
      const notf = new NotificationModel({
        name: text[0].trim(),
        message: text[1].trim(),
        to: "62ee26273d6e1a3100df86fe",
        all: true,
      });
      await notf.save();
      await ctx.reply("نوتفیکیشن با موفقیت به تمامی کاربران ارسال شد");
    } catch (err) {
      await ctx.reply(
        "داش نشد دیگه این چیه ناموسا دادی، یه مشکلی داره، دقیقا ببین چی گفتم اونجوری بفرست. اه"
      );
    }
  }
  export async function notificationUser(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }
    try {
      let text: any = ctx.text?.split("@");
      const notf = new NotificationModel({
        name: text[0].trim(),
        message: text[1].trim(),
        to: text[2].trim(),
      });
      await notf.save();
      await ctx.reply("نوتفیکیشن با موفقیت به کاربر ارسال شد");
    } catch (err) {
      await ctx.reply(
        "داش نشد دیگه این چیه ناموسا دادی، یه مشکلی داره، دقیقا ببین چی گفتم اونجوری بفرست. اه"
      );
    }
  }
  export async function notificationClear(ctx: update) {
    if (ctx.text === "بازگشت") {
      await start(ctx);
      step.setStep("main");
      return;
    }
    if (ctx.text === "بله") {
      await NotificationModel.deleteMany({});
      await ctx.reply("نوتفیکیشن‌ها با موفقیت پاکسازی شدن");
    }
  }
}
async function main(ctx: update) {
  if (ctx.text === "پرداخت‌ها") {
    const pays = await PayModel.find({}).limit(8);
    let string = "لیست درخواست های پرداخت \n\n";
    for await (let v of pays) {
      const coin = await CoinModel.findById(v.coin);
      const time = new Date(v.timestamp as number);
      string +=
        "کاربر :‌ " +
        v.user +
        "\n ارز : " +
        coin?.name +
        "\n مقدار :‌ "+
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
  } else if (ctx.text === "برداشت‌ها") {
    const withs = await WithdrawModel.find({}).limit(8);
    let string = "لیست درخواست های برداشت \n\n";
    for await (let v of withs) {
      const coin = await CoinModel.findById(v.coin);
      const time = new Date(v.timestamp as number);
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
  } else if (ctx.text === "پلن‌ها") {
    await ctx.reply("برای ادامه یکی از گزینه هارا انتخاب کنید", {
      replyMarkup: {
        resizeKeyboard: true,
        keyboard: [["لیست"], ["افزودن", "حذف"], ["بازگشت"]],
      },
    });
    step.setStep("plan");
  } else if (ctx.text === "ارز‌ها") {
    await ctx.reply("برای ادامه یکی از گزینه هارا انتخاب کنید", {
      replyMarkup: {
        resizeKeyboard: true,
        keyboard: [["لیست"], ["افزودن", "حذف"], ["بروزرسانی قیمت"], ["بازگشت"]],
      },
    });
    step.setStep("coin");
  } else if (ctx.text === "ولت‌ها") {
    await ctx.reply("برای ادامه یکی از گزینه هارا انتخاب کنید", {
      replyMarkup: {
        resizeKeyboard: true,
        keyboard: [["لیست"], ["افزودن", "حذف"], ["بازگشت"]],
      },
    });
    step.setStep("config");
  } else if (ctx.text === "هدر‌ها") {
    await ctx.reply("برای ادامه یکی از گزینه هارا انتخاب کنید", {
      replyMarkup: {
        resizeKeyboard: true,
        keyboard: [["لیست"], ["افزودن", "حذف"], ["بازگشت"]],
      },
    });
    step.setStep("header");
  } else if (ctx.text === "کاربران") {
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
  } else if (ctx.text === "نوتفیکیشن‌ها") {
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

const admins = [5223219863n];
  

bot.on("message", (ctx) => {
  if(!admins.includes(ctx.from.id)) return;
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
