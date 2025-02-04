export const data = {
	clients: [
		{
			_id: '6759456a8bcb14617aa787c7',
			company: 'Hyundai',
			company_addr: '서울 이태원',
			status: true,
			buildings: [
				{
					_id: 'b1',
					building_name: 'Hyundai Tower',
					building_addr: 'Seoul Itaewon',
					building_sts: true,
					permit_date: '2024-01-01',
					expiration_date: '2025-01-01',
					users: [
						{
							_id: 'user1',
							user_name: 'Mansur',
							user_email: 'mansur@gmail.com',
							user_phone: '123456432',
							user_title: 'Manager',
							user_type: 'Client',
						},
						{
							_id: 'user2',
							user_name: 'Ahmad',
							user_email: 'ahmad@gmail.com',
							user_phone: '789654321',
							user_title: 'Supervisor',
							user_type: 'Client',
						},
					],
					gateway_sets: [
						{
							_id: 'gw1',
							nodes: 'Node1',
							product_status: true,
							serial_number: '0001',
						},
						{
							_id: 'gw2',
							nodes: 'Node2',
							product_status: false,
							serial_number: '0002',
						},
					],
				},
				{
					_id: 'b2',
					building_name: 'Hyundai Plaza',
					building_addr: 'Seoul Gangnam',
					building_sts: true,
					permit_date: '2024-03-01',
					expiration_date: '2025-03-01',
					users: [
						{
							_id: 'user3',
							user_name: 'Ali',
							user_email: 'ali@gmail.com',
							user_phone: '456123789',
							user_title: 'CEO',
							user_type: 'Client',
						},
					],
					gateway_sets: [
						{
							_id: 'gw3',
							nodes: 'Node3',
							product_status: true,
							serial_number: '0003',
						},
					],
				},
			],
		},
		{
			_id: '6759466b8bcc24628bb897d8',
			company: 'Samsung',
			company_addr: '서울 서초구',
			status: false,
			buildings: [
				{
					_id: 'b3',
					building_name: 'Samsung HQ',
					building_addr: 'Seoul Seocho',
					building_sts: true,
					permit_date: '2023-05-01',
					expiration_date: '2026-05-01',
					users: [],
					gateway_sets: [],
				},
			],
		},
	],
}
