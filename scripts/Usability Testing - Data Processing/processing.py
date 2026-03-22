import pandas as pd
from datetime import timedelta


def preprocess_demographics():
    csv_name = 'Usability Testing - Data Collection.csv'

    data = pd.read_csv(
        csv_name,
        header=None,
        names=[
            'Age',
            'Gender',
            'Technical Proficiency',
            'Campus Familiarity',
            'Disability'
        ],
        usecols=[0, 1, 2, 3, 4],
        skiprows=5
    )
    indices = list(range(0, len(data) - 30, 13))
    data = data.iloc[indices]
    
    participants = pd.read_csv(
        csv_name,
        header=None,
        names=['Participant'],
        usecols=[1],
        skiprows=3
    ).astype(str).apply(lambda x: x.str.strip())
    participants = participants.iloc[indices]

    df = participants.join(data, how='inner')
    df['Disability'] = df['Disability'].fillna('None')
    return df


def preprocess_feedback():
    df = pd.read_csv(
        'Usability Testing - Post Feedback.csv',
        header=None,
        usecols=[0, 1],
        skiprows=2
    )

    indices = range(0, len(df), 26)
    field_names = [
        'Ease of Use',
        'Probability of Use',
        'Likes', 'Dislikes',
        'Suggestions',
        'Comments'
    ]

    records = [
        {
            "Participant": df.iloc[i, 1],
            **{
                field_names[j]: df.iloc[i + 2 + (j*4), 0]
                for j in range(len(field_names))
            }
        } for i in indices
    ]
    
    return pd.DataFrame(records).astype(str).apply(lambda x: x.str.strip()).fillna('')


def process_events(participants):
    df = pd.read_csv(
        'export-2026-03-19-190104.csv',
        header=None,
        names=['Participant', 'Time', 'Type'],
        parse_dates=['Time'],
        skiprows=1
    )[::-1].reset_index(drop=True)

    df['Participant'] = df['Participant'].astype(str).str.strip()
    df['Time'] = pd.to_datetime(df['Time'], errors='coerce')
    df['Type'] = df['Type'].astype(str).str.strip()

    participant_order = participants.tolist()
    df = pd.merge(participants, df, on='Participant')
    df['Participant'] = pd.Categorical(df['Participant'], categories=participant_order, ordered=True)
    df = df.sort_values(by=['Participant', 'Time']).reset_index(drop=True)

    map_loaded = 'map_loaded'
    jmsb_address_copied = 'jmsb_address_copied'
    jmsb_first_floor = 'jmsb_first_floor'
    directions_sheet_open = 'directions_sheet_open'
    shuttle_bus_route_selected = 'shuttle_bus_route_selected'
    destination_updated_through_searchbar = 'destination_updated_through_searchbar'
    app_reopened_to_skip = 'app_reopened_to_skip'
    autocapture = '$autocapture'

    new_values = []
    i = 0
    while i < (size := len(df)):
        current_participant = df.loc[i, 'Participant']
        def safe():
            return i < size and df.loc[i, 'Participant'] == current_participant
        
        last_timestamp = df.loc[i, 'Time']
        original_i = map_loaded_i = i
        while safe() and (__type := df.loc[i, 'Type']) != jmsb_address_copied and (df.loc[i, 'Time'] - last_timestamp).total_seconds() < 20:
            last_timestamp = df.loc[i, 'Time']
            if __type == map_loaded and original_i == map_loaded_i:
                map_loaded_i = i
            i += 1
        if __type == jmsb_address_copied:
            i = map_loaded_i
        
        def obtain_task_metrics(milestone):
            nonlocal i
            if not safe(): return {}

            start_time = df.loc[i, 'Time']
            num_touches = 0

            i += 1
            while safe() and (_type := df.loc[i, 'Type']) not in [milestone, app_reopened_to_skip]:
                if _type == autocapture:
                    num_touches += 1
                i += 1
            
            duration = df.loc[i, 'Time'] - start_time
            if milestone != jmsb_address_copied:
                duration -= timedelta(seconds=4) # Adjustment to account for task explanation
                if duration < timedelta(seconds=2):
                    duration = timedelta(seconds=2)
            completion = _type == milestone

            def get_task_number(milestone):
                match milestone:
                    case val if val == jmsb_address_copied:
                        return 1
                    case val if val == jmsb_first_floor:
                        return 2
                    case val if val == directions_sheet_open:
                        return 3
                    case val if val == shuttle_bus_route_selected:
                        return 4
                    case val if val == destination_updated_through_searchbar:
                        return 5
                    case _:
                        return 0
                    
            def get_expected_touch_num(milestone): # Slightly more than expected (small margin of tolerance)
                match milestone:
                    case val if val == jmsb_address_copied:
                        return 6
                    case val if val == jmsb_first_floor:
                        return 2
                    case val if val == directions_sheet_open:
                        return 5
                    case val if val == shuttle_bus_route_selected:
                        return 6
                    case val if val == destination_updated_through_searchbar:
                        return 4
                    case _:
                        return 0

            task_num = 'Task ' + str(get_task_number(milestone)) + ' '

            expected_touch_num = get_expected_touch_num(milestone)
            num_mistouches = num_touches - expected_touch_num if expected_touch_num < num_touches else 0

            return {
                task_num + metric: value
                for metric, value in {
                    'Completion': completion,
                    'Duration in Seconds (s)': duration.total_seconds(),
                    'Number of Touches': num_touches,
                    'Number of Mistouches': num_mistouches
                }.items()
            } 
        
        milestones = [
            jmsb_address_copied,
            jmsb_first_floor,
            directions_sheet_open,
            shuttle_bus_route_selected,
            destination_updated_through_searchbar
        ] 

        metrics = {}
        for milestone in milestones:
            metrics.update(obtain_task_metrics(milestone))
        row = {'Participant': current_participant, **metrics}
        new_values.append(row)

        while safe(): i += 1
    return pd.DataFrame(new_values)


def main():
    demographics = preprocess_demographics()
    feedback = preprocess_feedback()
    info = pd.merge(demographics, feedback, on='Participant')
    events = process_events(info['Participant'])
    print('Events:')
    print(events)
    results = pd.merge(events, info, on='Participant')
    results.to_csv('Processed Usability Testing Data.csv', index=False)


if __name__ == "__main__":
    main()
