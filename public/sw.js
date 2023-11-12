self.addEventListener("push", function (event) {
    console.log("Push event received", event);
    if (event.data) {
        const data = event.data.json();
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon,
            vibrate: [200, 100, 200, 100, 200, 100, 200],
            data: {
                url: data.url,
            },
        });
    } else {
        console.log("Push event but no data");
    }
});

self.addEventListener("notificationclick", function (event) {
    event.notification.close();
    if (event.notification.data && event.notification.data.url) {
        clients.openWindow(event.notification.data.url);
    }
});
