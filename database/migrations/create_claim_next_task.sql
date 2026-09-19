-- ========================================================================================
-- FUNÇÃO ATÔMICA DE REIVINDICAÇÃO DE TAREFA (FOR UPDATE SKIP LOCKED)
-- Elimina 100% das colisões de locks em frotas de 10+ workers simultâneos.
-- ========================================================================================

CREATE OR REPLACE FUNCTION claim_next_task(
    p_worker_id TEXT,
    p_preferred_lane TEXT DEFAULT 'ANY'
)
RETURNS SETOF task_queue AS $$
DECLARE
    v_task_id INT;
BEGIN
    -- Seleciona e bloqueia a próxima tarefa pendente sem travar outros workers
    SELECT id INTO v_task_id
    FROM task_queue
    WHERE 
        (
            (status = 'PENDING' AND (locked_at IS NULL OR locked_at <= NOW()))
            OR 
            (status = 'IN_PROGRESS' AND locked_at <= NOW() - INTERVAL '5 minutes')
        )
        AND (
            p_preferred_lane = 'ANY'
            OR (p_preferred_lane = 'FAST' AND task_type IN ('FETCH_DEATHS', 'FETCH_ONLINES', 'PROCESS_GUILD_INVITES'))
            OR (p_preferred_lane = 'BULK' AND task_type NOT IN ('FETCH_DEATHS', 'FETCH_ONLINES', 'PROCESS_GUILD_INVITES'))
        )
    ORDER BY 
        -- Prioridade máxima para eventos de tempo real
        CASE 
            WHEN task_type IN ('FETCH_DEATHS', 'FETCH_ONLINES', 'PROCESS_GUILD_INVITES') THEN 1 
            ELSE 2 
        END,
        locked_at ASC NULLS FIRST
    FOR UPDATE SKIP LOCKED
    LIMIT 1;

    -- Se encontrou uma tarefa disponível, atualiza seu estado atomicamente
    IF v_task_id IS NOT NULL THEN
        RETURN QUERY
        UPDATE task_queue
        SET 
            status = 'IN_PROGRESS',
            worker_id = p_worker_id,
            locked_at = NOW()
        WHERE id = v_task_id
        RETURNING *;
    END IF;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
