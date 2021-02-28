SELECT o.OrderId, mi.Name, 
o.TsOrderPlaced, oi.MenuItemId, COUNT(*) as 'Quantity'
FROM PhysicalRestaurants pr 
JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId 
JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId 
JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId 
WHERE pr.PhysicalRestaurantId = ${storeId}
GROUP BY o.OrderId, mi.Name, o.TsOrderPlaced, oi.MenuItemId
