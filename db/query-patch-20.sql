CREATE OR REPLACE FUNCTION public.abbreviate_words(input_text text)
RETURNS text
LANGUAGE plpgsql
AS $function$

DECLARE
    result TEXT := '';  
    word TEXT;          
    word_count INT;      
BEGIN
    word_count := array_length(string_to_array(input_text, ' '), 1);
    IF word_count = 1 THEN
        RETURN upper(input_text);   
    END IF;

    FOR word IN SELECT unnest(string_to_array(input_text, ' ')) LOOP
        result := result || substring(word, 1, 1);
    END LOOP;

    RETURN upper(result);  
END;

$function$;

GRANT EXECUTE ON FUNCTION public.abbreviate_words(text) TO dev_rppj;
GRANT SELECT ON TABLE public.trucks TO dev_rppj;