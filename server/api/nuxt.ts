// import Dolphin from "@/server/Dolphin/Dolphin";
// import User from "../Dolphin/User/User";

// export default eventHandler(async (event) => {
//     try {
//         const response: any = await new Promise((resolve, reject) => {
//             new Dolphin("mongodb://127.0.0.1:27017", "DolphinSchool", async (dolphin, success, error) => {
//                 if (success) {
//                     let user = (await dolphin.users?.findUser({
//                         username: event.context.auth.nickname
//                     }))?.[0] as User | undefined;
//                     console.log(event.context.auth.nickname)
//                     const response = {
//                         dolphin: dolphin.ready,
//                         user: user?.fullName ?? "No user found"
//                     };
//                     resolve(response);
//                 } else {
//                     const response = {
//                         error: error
//                     };
//                     reject(response);
//                 }
//             });
//         });

//         // Check if dolphin is defined before accessing its properties
//         if (response.dolphin) {
//             console.log(response.dolphin);
//         }

//         // Check if users is defined before accessing its properties
//         if (response.user) {
//             console.log(response.user.username);
//         }
//         return response;
//     } catch (error) {
//         console.error(error);
//         return { error: error };
//     }
// });
