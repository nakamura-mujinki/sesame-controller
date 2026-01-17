-- =============================================
-- 初期デバイス登録
-- ユーザーID: 80d9fc69-3bae-4c08-a293-77941959f2c4
-- =============================================

INSERT INTO public.devices (user_id, name, device_type, device_uuid, secret_key)
VALUES
    (
        '80d9fc69-3bae-4c08-a293-77941959f2c4',
        'Sesame Bot 2 (Lighting)',
        'bot',
        '11200423-0300-0207-5500-0A01FFFFFFFF',
        'fcf7adabb9daf83476f255b5be40c5b7'
    ),
    (
        '80d9fc69-3bae-4c08-a293-77941959f2c4',
        'Sesame 5 (Entrance)',
        'lock',
        '11200416-0103-0701-CA00-8100FFFFFFFF',
        '66c9750fd4b8133bb83c55c4a3e01484'
    )
ON CONFLICT (user_id, device_uuid) DO NOTHING;
